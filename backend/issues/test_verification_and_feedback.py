import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from issues.models import (
    Complaint, Department, DepartmentStaff, ComplaintAssignment,
    ComplaintCompletion, ComplaintFeedback, ComplaintStatusHistory,
    Notification, UserProfile
)


def create_test_image(filename="test_completion.jpg"):
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color=(73, 109, 137))
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile(filename, file.read(), content_type='image/jpeg')


class AuthorityVerificationAndCitizenFeedbackTests(APITestCase):
    """
    Comprehensive tests for the CivicConnect 4-stage workflow:
    Pending -> In Progress -> Awaiting Authority Verification -> Resolved
    - Staff Completion with completion photo & remarks
    - Municipal Authority verification (Approve / Reject with reasons & notifications)
    - Citizen resolution tracking and optional 1-5 star rating & feedback
    """

    def setUp(self):
        # 1. Citizen
        self.citizen_user = User.objects.create_user(
            username='citizen@test.civic',
            email='citizen@test.civic',
            password='Password123!',
            first_name='Citizen',
            last_name='User'
        )
        UserProfile.objects.create(user=self.citizen_user, role='CITIZEN')

        # 2. Another Citizen (for unauthorized feedback tests)
        self.other_citizen = User.objects.create_user(
            username='other@test.civic',
            email='other@test.civic',
            password='Password123!',
            first_name='Other',
            last_name='Citizen'
        )
        UserProfile.objects.create(user=self.other_citizen, role='CITIZEN')

        # 3. Municipal Authority
        self.auth_user = User.objects.create_user(
            username='authority@test.civic',
            email='authority@test.civic',
            password='Password123!',
            first_name='Municipal',
            last_name='Commissioner'
        )
        UserProfile.objects.create(user=self.auth_user, role='MUNICIPAL_AUTHORITY')

        # 4. Department
        self.dept = Department.objects.create(name='Sanitation and Public Health')

        # 5. Department Staff
        self.staff_user = User.objects.create_user(
            username='staff@sanitation.civic',
            email='staff@sanitation.civic',
            password='Password123!',
            first_name='Suresh',
            last_name='Kumar'
        )
        UserProfile.objects.create(user=self.staff_user, role='DEPARTMENT_STAFF')
        self.staff_profile = DepartmentStaff.objects.create(user=self.staff_user, department=self.dept)

        # 6. Initial Complaint created by Citizen
        self.complaint = Complaint.objects.create(
            description='Garbage bins overflowing, causing traffic bottleneck and health hazard.',
            category='Garbage',
            location='Main Road Junction, Block C',
            latitude=12.9716,
            longitude=77.5946,
            citizen=self.citizen_user,
            department=self.dept,
            status='Pending'
        )
        # Assign to staff
        self.assignment = ComplaintAssignment.objects.create(
            complaint=self.complaint,
            staff=self.staff_profile,
            assigned_by=self.auth_user,
            is_active=True
        )

    # =========================================================================
    # 1. Department Staff - Completion
    # =========================================================================

    def test_staff_can_view_assigned_complaints(self):
        """Staff can view complaints assigned to them."""
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.get('/api/complaints/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Should see the complaint in their department/assigned list
        complaint_ids = [c['id'] for c in res.data]
        self.assertIn(self.complaint.id, complaint_ids)

    def test_staff_cannot_mark_complaint_as_resolved_directly(self):
        """Department staff must not be allowed to mark complaints directly as Resolved."""
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.patch(
            f'/api/complaints/{self.complaint.id}/',
            {'status': 'Resolved'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot mark a complaint as Resolved directly', res.data.get('error', ''))

    def test_staff_completion_requires_remarks(self):
        """Completion requires non-empty completion remarks."""
        self.client.force_authenticate(user=self.staff_user)
        photo = create_test_image()
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/complete/',
            {'completion_remarks': '', 'completion_image': photo},
            format='multipart'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Completion remarks are required', res.data.get('error', ''))

    def test_staff_completion_requires_photo(self):
        """Staff completion requires a completion photo upload."""
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/complete/',
            {'completion_remarks': 'Cleaned up all trash.'},
            format='multipart'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('A completion photo is required', res.data.get('error', ''))

    def test_staff_completion_success_sets_awaiting_authority_verification(self):
        """
        When work is completed, staff uploads completion photo and remarks.
        Status changes to 'Awaiting Authority Verification'.
        """
        self.complaint.status = 'In Progress'
        self.complaint.save()

        self.client.force_authenticate(user=self.staff_user)
        photo = create_test_image('work_done.jpg')
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/complete/',
            {
                'completion_remarks': 'Removed 2 truckloads of garbage and disinfected the area.',
                'completion_image': photo
            },
            format='multipart'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Awaiting Authority Verification')

        # Verify ComplaintCompletion record
        completion = self.complaint.completions.first()
        self.assertIsNotNone(completion)
        self.assertEqual(completion.submitted_by, self.staff_user)
        self.assertEqual(completion.completion_remarks, 'Removed 2 truckloads of garbage and disinfected the area.')
        self.assertTrue(bool(completion.completion_image))
        self.assertEqual(completion.verification_status, 'Pending')

        # Verify notifications sent to authority and citizen
        auth_notif = Notification.objects.filter(user=self.auth_user, complaint=self.complaint).first()
        self.assertIsNotNone(auth_notif)
        self.assertIn('Verification Required', auth_notif.title)

        citizen_notif = Notification.objects.filter(user=self.citizen_user, complaint=self.complaint).first()
        self.assertIsNotNone(citizen_notif)
        self.assertIn('awaiting verification by the Municipal Authority', citizen_notif.message)

    # =========================================================================
    # 2. Municipal Authority - Verification (Approve / Reject)
    # =========================================================================

    def test_authority_can_view_awaiting_verification_complaints_with_details(self):
        """Authority can view complaints awaiting verification with both photos and remarks."""
        self.complaint.status = 'Awaiting Authority Verification'
        self.complaint.save()

        photo = create_test_image('completion_proof.jpg')
        completion = ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff_user,
            completion_remarks='Road repaved and asphalt rolled.',
            completion_image=photo,
            verification_status='Pending'
        )

        self.client.force_authenticate(user=self.auth_user)
        res = self.client.get(f'/api/complaints/{self.complaint.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'Awaiting Authority Verification')
        self.assertIsNotNone(res.data.get('completion_photo'))
        self.assertEqual(res.data.get('latest_completion')['completion_remarks'], 'Road repaved and asphalt rolled.')

    def test_authority_reject_requires_rejection_reason(self):
        """Authority rejection requires a rejection reason."""
        self.complaint.status = 'Awaiting Authority Verification'
        self.complaint.save()

        self.client.force_authenticate(user=self.auth_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/verify/',
            {'action': 'reject', 'rejection_reason': ''},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rejection reason is required', res.data.get('error', '').lower())

    def test_authority_reject_returns_to_in_progress_and_notifies_staff_and_citizen(self):
        """
        When rejected, status returns to 'In Progress', records authority, timestamp, reason,
        and notifies assigned staff and citizen.
        """
        self.complaint.status = 'Awaiting Authority Verification'
        self.complaint.save()

        photo = create_test_image()
        ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff_user,
            completion_remarks='Cleared partially.',
            completion_image=photo,
            verification_status='Pending'
        )

        self.client.force_authenticate(user=self.auth_user)
        rejection_reason = "Corner pavement still has remaining debris. Please clear completely."
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/verify/',
            {'action': 'reject', 'rejection_reason': rejection_reason},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'In Progress')
        self.assertEqual(self.complaint.verification_remarks, rejection_reason)

        # Assigned staff notification
        staff_notif = Notification.objects.filter(user=self.staff_user, complaint=self.complaint).first()
        self.assertIsNotNone(staff_notif)
        self.assertIn('Verification Rejected', staff_notif.title)
        self.assertIn(rejection_reason, staff_notif.message)

        # Citizen notification
        citizen_notif = Notification.objects.filter(user=self.citizen_user, complaint=self.complaint).first()
        self.assertIsNotNone(citizen_notif)
        self.assertIn('In Progress', citizen_notif.message)

        # Status history contains rejection
        history_entry = self.complaint.status_history.latest('updated_at')
        self.assertEqual(history_entry.status, 'In Progress')
        self.assertIn(rejection_reason, history_entry.remarks)

    def test_authority_approve_changes_status_to_resolved_and_records_verifier(self):
        """
        When approved, change status to 'Resolved', record verifier, timestamp, remarks,
        and notify citizen and staff.
        """
        self.complaint.status = 'Awaiting Authority Verification'
        self.complaint.save()

        photo = create_test_image()
        ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff_user,
            completion_remarks='All waste removed and site sanitized.',
            completion_image=photo,
            verification_status='Pending'
        )

        self.client.force_authenticate(user=self.auth_user)
        approval_remarks = "Inspected and confirmed thorough sanitation work."
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/verify/',
            {'action': 'approve', 'remarks': approval_remarks},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Resolved')
        self.assertEqual(self.complaint.verified_by, self.auth_user)
        self.assertIsNotNone(self.complaint.verified_at)
        self.assertEqual(self.complaint.verification_remarks, approval_remarks)

        # Citizen notification
        citizen_notif = Notification.objects.filter(user=self.citizen_user, complaint=self.complaint).first()
        self.assertIsNotNone(citizen_notif)
        self.assertIn('Resolved', citizen_notif.title)

        # Staff notification
        staff_notif = Notification.objects.filter(user=self.staff_user, complaint=self.complaint).first()
        self.assertIsNotNone(staff_notif)
        self.assertIn('Approved', staff_notif.title)

    # =========================================================================
    # 3. Citizen - Tracking and Optional Feedback
    # =========================================================================

    def test_citizen_can_view_completion_photo_and_resolution_details(self):
        """Citizen can view complaint status, completion photo, and resolution details."""
        self.complaint.status = 'Resolved'
        self.complaint.verified_by = self.auth_user
        self.complaint.verification_remarks = "Approved after site inspection."
        self.complaint.save()

        photo = create_test_image('resolved_work.jpg')
        ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff_user,
            completion_remarks='Garbage cleared completely.',
            completion_image=photo,
            verification_status='Approved',
            verified_by=self.auth_user
        )

        self.client.force_authenticate(user=self.citizen_user)
        res = self.client.get(f'/api/complaints/{self.complaint.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'Resolved')
        self.assertIsNotNone(res.data['completion_photo'])
        self.assertEqual(res.data['verified_by_name'], 'Municipal Commissioner')
        self.assertEqual(res.data['verification_remarks'], 'Approved after site inspection.')

    def test_citizen_cannot_submit_feedback_before_resolved(self):
        """Feedback can only be submitted once complaint is Resolved."""
        self.complaint.status = 'In Progress'
        self.complaint.save()

        self.client.force_authenticate(user=self.citizen_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/feedback/',
            {'rating': 5, 'comment': 'Looks good'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('resolved', res.data.get('error', '').lower())

    def test_only_submitting_citizen_can_provide_feedback(self):
        """Allow only the citizen who submitted the complaint to provide feedback."""
        self.complaint.status = 'Resolved'
        self.complaint.save()

        # Another citizen attempts feedback
        self.client.force_authenticate(user=self.other_citizen)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/feedback/',
            {'rating': 4, 'comment': 'Great job'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Only the citizen who submitted', res.data.get('error', ''))

    def test_feedback_star_rating_validation(self):
        """Ratings must be between 1 and 5."""
        self.complaint.status = 'Resolved'
        self.complaint.save()

        self.client.force_authenticate(user=self.citizen_user)
        # Invalid rating 0
        res_zero = self.client.post(
            f'/api/complaints/{self.complaint.id}/feedback/',
            {'rating': 0},
            format='json'
        )
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid rating 6
        res_six = self.client.post(
            f'/api/complaints/{self.complaint.id}/feedback/',
            {'rating': 6},
            format='json'
        )
        self.assertEqual(res_six.status_code, status.HTTP_400_BAD_REQUEST)

    def test_citizen_feedback_options_and_update(self):
        """
        Citizens can submit:
        1. Rating only
        2. Written feedback only
        3. Both rating and comment
        And duplicate submissions update the existing feedback.
        """
        self.complaint.status = 'Resolved'
        self.complaint.save()

        self.client.force_authenticate(user=self.citizen_user)

        # 1. Star rating only
        res1 = self.client.post(
            f'/api/complaints/{self.complaint.id}/feedback/',
            {'rating': 4},
            format='json'
        )
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['feedback']['rating'], 4)
        self.assertIsNone(res1.data['feedback']['comment'])

        # 2. Update existing feedback with written comment and new rating
        res2 = self.client.post(
            f'/api/complaints/{self.complaint.id}/feedback/',
            {'rating': 5, 'comment': 'Cleaned up very fast and thoroughly. Thank you!'},
            format='json'
        )
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['feedback']['rating'], 5)
        self.assertEqual(res2.data['feedback']['comment'], 'Cleaned up very fast and thoroughly. Thank you!')

        # Verify only 1 feedback record exists for this complaint (no duplicates)
        self.assertEqual(ComplaintFeedback.objects.filter(complaint=self.complaint).count(), 1)

    def test_municipal_authority_can_view_citizen_feedback(self):
        """Submitted feedback is displayed in complaint details for Municipal Authority."""
        self.complaint.status = 'Resolved'
        self.complaint.save()

        ComplaintFeedback.objects.create(
            complaint=self.complaint,
            citizen=self.citizen_user,
            rating=5,
            comment='Outstanding responsiveness by the municipal staff.'
        )

        self.client.force_authenticate(user=self.auth_user)
        res = self.client.get(f'/api/complaints/{self.complaint.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        feedback_data = res.data.get('feedback')
        self.assertIsNotNone(feedback_data)
        self.assertEqual(feedback_data['rating'], 5)
        self.assertEqual(feedback_data['comment'], 'Outstanding responsiveness by the municipal staff.')
        self.assertEqual(feedback_data['citizen_name'], 'Citizen User')
