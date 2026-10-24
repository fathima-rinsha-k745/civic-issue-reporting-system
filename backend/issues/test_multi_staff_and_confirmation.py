from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from issues.models import (
    UserProfile, Department, DepartmentStaff, Complaint,
    ComplaintAssignment, ComplaintCompletion, ComplaintStatusHistory, Notification
)

class MultiStaffAssignmentAndCitizenConfirmationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Departments
        self.sanitation_dept = Department.objects.create(name='Sanitation Department')
        self.roads_dept = Department.objects.create(name='Roads & Works')

        # Create Municipal Authority
        self.auth_user = User.objects.create_user(
            username='authority@civicconnect.gov.in',
            email='authority@civicconnect.gov.in',
            password='AuthorityPass123!',
            first_name='Rajesh',
            last_name='Menon'
        )
        self.auth_profile = UserProfile.objects.create(
            user=self.auth_user,
            role='MUNICIPAL_AUTHORITY'
        )

        # Create Citizen 1 (Complaint Owner)
        self.citizen_user = User.objects.create_user(
            username='citizen@kerala.in',
            email='citizen@kerala.in',
            password='CitizenPass123!',
            first_name='Rahul',
            last_name='Sharma'
        )
        self.citizen_profile = UserProfile.objects.create(
            user=self.citizen_user,
            role='CITIZEN'
        )

        # Create Citizen 2 (Other Citizen)
        self.other_citizen = User.objects.create_user(
            username='other@kerala.in',
            email='other@kerala.in',
            password='OtherPass123!',
            first_name='Priya',
            last_name='Verma'
        )
        self.other_citizen_profile = UserProfile.objects.create(
            user=self.other_citizen,
            role='CITIZEN'
        )

        # Create Staff 1 (Sanitation)
        self.staff1_user = User.objects.create_user(
            username='anjali.nair@civicconnect.gov.in',
            email='anjali.nair@civicconnect.gov.in',
            password='StaffPass123!',
            first_name='Anjali',
            last_name='Nair'
        )
        UserProfile.objects.create(user=self.staff1_user, role='DEPARTMENT_STAFF')
        self.staff1 = DepartmentStaff.objects.create(
            user=self.staff1_user,
            department=self.sanitation_dept
        )

        # Create Staff 2 (Sanitation)
        self.staff2_user = User.objects.create_user(
            username='suresh.kumar@civicconnect.gov.in',
            email='suresh.kumar@civicconnect.gov.in',
            password='StaffPass123!',
            first_name='Suresh',
            last_name='Kumar'
        )
        UserProfile.objects.create(user=self.staff2_user, role='DEPARTMENT_STAFF')
        self.staff2 = DepartmentStaff.objects.create(
            user=self.staff2_user,
            department=self.sanitation_dept
        )

        # Create Staff 3 (Roads)
        self.staff3_user = User.objects.create_user(
            username='vijay.menon@civicconnect.gov.in',
            email='vijay.menon@civicconnect.gov.in',
            password='StaffPass123!',
            first_name='Vijay',
            last_name='Menon'
        )
        UserProfile.objects.create(user=self.staff3_user, role='DEPARTMENT_STAFF')
        self.staff3 = DepartmentStaff.objects.create(
            user=self.staff3_user,
            department=self.roads_dept
        )

        # Create a Complaint by Citizen 1
        self.complaint = Complaint.objects.create(
            citizen=self.citizen_user,
            description="Overflowing dumpster on Market Road.",
            location="Market Road, Ernakulam",
            latitude="9.981600",
            longitude="76.279900",
            category="Other",
            status="Pending"
        )
        ComplaintStatusHistory.objects.create(
            complaint=self.complaint,
            status='Pending',
            remarks='Complaint Submitted',
            updated_by=self.citizen_user
        )

    # ==================== FEATURE 1 TESTS ====================

    def test_authority_assigns_multiple_staff_from_same_department(self):
        """
        Verify Municipal Authority can assign multiple staff members from the same department
        to one complaint.
        """
        self.client.force_authenticate(user=self.auth_user)
        payload = {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id, self.staff2.id],
            'remarks': 'Assigned to sanitation field team.'
        }
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.department, self.sanitation_dept)

        # Check assignments in database
        active_assignments = ComplaintAssignment.objects.filter(complaint=self.complaint, is_active=True)
        self.assertEqual(active_assignments.count(), 2)
        assigned_staff_ids = set(active_assignments.values_list('staff_id', flat=True))
        self.assertEqual(assigned_staff_ids, {self.staff1.id, self.staff2.id})

        # Check response contains assigned staff members
        self.assertEqual(len(res.data['assigned_staff_members']), 2)
        self.assertEqual(set(res.data['assigned_staff_ids']), {self.staff1.id, self.staff2.id})

    def test_authority_cannot_assign_staff_from_different_department(self):
        """
        Verify that staff members not belonging to the chosen department cannot be assigned.
        """
        self.client.force_authenticate(user=self.auth_user)
        payload = {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id, self.staff3.id]  # staff3 is Roads & Works
        }
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('belong to the selected department', res.data.get('error', ''))

    def test_department_reassignment_deactivates_incompatible_assignments(self):
        """
        Verify that changing a complaint's department deactivates staff assignments
        from the previous department atomically.
        """
        # First assign Sanitation staff
        ComplaintAssignment.objects.create(
            complaint=self.complaint,
            staff=self.staff1,
            assigned_by=self.auth_user,
            is_active=True
        )
        self.complaint.department = self.sanitation_dept
        self.complaint.save()

        # Authority changes department to Roads & Works with Staff 3
        self.client.force_authenticate(user=self.auth_user)
        payload = {
            'department': self.roads_dept.id,
            'assigned_staff_ids': [self.staff3.id]
        }
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.department, self.roads_dept)

        # Sanitation assignment should now be inactive
        sanitation_assignment = ComplaintAssignment.objects.get(complaint=self.complaint, staff=self.staff1)
        self.assertFalse(sanitation_assignment.is_active)

        # Roads assignment should be active
        roads_assignment = ComplaintAssignment.objects.get(complaint=self.complaint, staff=self.staff3)
        self.assertTrue(roads_assignment.is_active)

    def test_staff_dashboard_displays_shared_complaint_and_other_team_members(self):
        """
        Both assigned staff members see the complaint on their dashboard, with other team members listed.
        """
        # Assign both staff1 and staff2
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff2, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.save()

        # Staff 1 queries complaints
        self.client.force_authenticate(user=self.staff1_user)
        res1 = self.client.get('/api/complaints/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        ids1 = [c['id'] for c in res1.data]
        self.assertIn(self.complaint.id, ids1)

        # Staff 2 queries complaints
        self.client.force_authenticate(user=self.staff2_user)
        res2 = self.client.get('/api/complaints/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        ids2 = [c['id'] for c in res2.data]
        self.assertIn(self.complaint.id, ids2)

        # Detail view includes both assigned staff members
        res_detail = self.client.get(f'/api/complaints/{self.complaint.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_detail.data['assigned_staff_members']), 2)

    # ==================== FEATURE 2 TESTS ====================

    def test_staff_cannot_directly_set_status_to_resolved(self):
        """
        Verify department staff cannot directly mark a complaint as Resolved.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'In Progress'
        self.complaint.save()

        self.client.force_authenticate(user=self.staff1_user)
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', {'status': 'Resolved'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot mark a complaint as Resolved directly', res.data.get('error', ''))

    def test_staff_mark_work_completed_requires_remarks_and_notifies_citizen(self):
        """
        Verify staff can submit completion remarks without photo upload,
        updating status to 'Awaiting Citizen Confirmation' and notifying citizen.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'In Progress'
        self.complaint.save()

        self.client.force_authenticate(user=self.staff1_user)

        # 1. Missing remarks fails
        res_fail = self.client.post(f'/api/complaints/{self.complaint.id}/complete/', {'completion_remarks': ''}, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Valid submission
        remarks_text = "The overflowing garbage was cleared from the residential area."
        res = self.client.post(f'/api/complaints/{self.complaint.id}/complete/', {'completion_remarks': remarks_text}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Awaiting Citizen Confirmation')

        # Check ComplaintCompletion record
        completion = ComplaintCompletion.objects.filter(complaint=self.complaint).first()
        self.assertIsNotNone(completion)
        self.assertEqual(completion.submitted_by, self.staff1_user)
        self.assertEqual(completion.completion_remarks, remarks_text)
        self.assertEqual(completion.citizen_response, 'Pending')

        # Check Status History
        history = ComplaintStatusHistory.objects.filter(complaint=self.complaint, status='Awaiting Citizen Confirmation').first()
        self.assertIsNotNone(history)
        self.assertEqual(history.updated_by, self.staff1_user)
        self.assertEqual(history.remarks, remarks_text)

        # Check Citizen Notification with exact required title and message
        notif = Notification.objects.filter(user=self.citizen_user, complaint=self.complaint).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.title, "Please Confirm Your Complaint Resolution")
        self.assertEqual(
            notif.message,
            "The department staff have reported that work on your complaint has been completed. Please review the completion remarks and confirm whether the issue has actually been fixed."
        )

    def test_citizen_confirms_issue_is_fixed(self):
        """
        When original citizen clicks 'Yes, Resolved', status changes to Resolved
        and notifications are sent to assigned staff and municipal authority.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'Awaiting Citizen Confirmation'
        self.complaint.save()

        completion = ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff1_user,
            completion_remarks="Dumpster cleared.",
            citizen_response='Pending'
        )

        # Citizen confirms
        self.client.force_authenticate(user=self.citizen_user)
        res = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'confirm'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Resolved')

        completion.refresh_from_db()
        self.assertEqual(completion.citizen_response, 'Confirmed')
        self.assertIsNotNone(completion.responded_at)

        # Check notifications sent to staff and authority
        staff_notif = Notification.objects.filter(user=self.staff1_user, complaint=self.complaint)
        self.assertTrue(staff_notif.exists())

        auth_notif = Notification.objects.filter(user=self.auth_user, complaint=self.complaint)
        self.assertTrue(auth_notif.exists())

    def test_citizen_reports_issue_not_fixed_reopens_to_in_progress(self):
        """
        When citizen clicks 'No, Not Fixed', remarks are required, status moves back
        to In Progress, and notifications are sent.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'Awaiting Citizen Confirmation'
        self.complaint.save()

        completion = ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff1_user,
            completion_remarks="Garbage cleared.",
            citizen_response='Pending'
        )

        self.client.force_authenticate(user=self.citizen_user)

        # 1. Missing remarks fails
        res_fail = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'reject', 'remarks': ''}, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Valid rejection with explanation
        dispute_text = "The bins are still full behind the grocery shop."
        res = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'reject', 'remarks': dispute_text}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'In Progress')

        completion.refresh_from_db()
        self.assertEqual(completion.citizen_response, 'Disputed')
        self.assertEqual(completion.citizen_remarks, dispute_text)

        # Check status history logs the rejection reason
        latest_hist = ComplaintStatusHistory.objects.filter(complaint=self.complaint).order_by('-updated_at', '-id').first()
        self.assertEqual(latest_hist.status, 'In Progress')
        self.assertIn(dispute_text, latest_hist.remarks)

        # Staff can do work again and submit another completion
        self.client.force_authenticate(user=self.staff1_user)
        res_second_comp = self.client.post(f'/api/complaints/{self.complaint.id}/complete/', {
            'completion_remarks': 'Secondary cleanup completed including grocery shop alley.'
        }, format='json')
        self.assertEqual(res_second_comp.status_code, status.HTTP_200_OK)

        # Verify audit history preserves both completion records
        all_completions = ComplaintCompletion.objects.filter(complaint=self.complaint).order_by('submitted_at')
        self.assertEqual(all_completions.count(), 2)
        self.assertEqual(all_completions[0].citizen_response, 'Disputed')
        self.assertEqual(all_completions[1].citizen_response, 'Pending')

    def test_unauthorized_user_cannot_confirm_resolution(self):
        """
        Verify that another citizen or staff cannot confirm/reject resolution on behalf of the owner.
        """
        self.complaint.status = 'Awaiting Citizen Confirmation'
        self.complaint.save()

        # Other citizen tries to confirm
        self.client.force_authenticate(user=self.other_citizen)
        res = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'confirm'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Staff tries to confirm
        self.client.force_authenticate(user=self.staff1_user)
        res_staff = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'confirm'}, format='json')
        self.assertEqual(res_staff.status_code, status.HTTP_403_FORBIDDEN)

    def test_notification_endpoints(self):
        """
        Verify notification listing, marking read, and unread count endpoints.
        """
        n1 = Notification.objects.create(user=self.citizen_user, title="Title 1", message="Message 1", is_read=False)
        n2 = Notification.objects.create(user=self.citizen_user, title="Title 2", message="Message 2", is_read=False)

        self.client.force_authenticate(user=self.citizen_user)

        # Check unread count
        res_count = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res_count.status_code, status.HTTP_200_OK)
        self.assertEqual(res_count.data['unread_count'], 2)

        # Mark n1 read
        res_mark = self.client.post(f'/api/notifications/{n1.id}/read/')
        self.assertEqual(res_mark.status_code, status.HTTP_200_OK)

        n1.refresh_from_db()
        self.assertTrue(n1.is_read)

        # Verify unread count decremented
        res_count2 = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res_count2.data['unread_count'], 1)

    def test_timeline_serializer_display_names_and_action_labels(self):
        """
        Verify status history returns friendly actor names, roles, and action labels instead of email addresses.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'In Progress'
        self.complaint.save()

        # 1. Submission event by citizen
        h1 = ComplaintStatusHistory.objects.filter(complaint=self.complaint, status='Pending').first()
        self.assertIsNotNone(h1)

        # 2. Staff completion event
        self.client.force_authenticate(user=self.staff1_user)
        self.client.post(f'/api/complaints/{self.complaint.id}/complete/', {
            'completion_remarks': 'Sanitation team removed all debris.'
        }, format='json')

        # 3. Citizen confirm event
        self.client.force_authenticate(user=self.citizen_user)
        self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'confirm'}, format='json')

        # Fetch complaint details via API
        res = self.client.get(f'/api/complaints/{self.complaint.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        history = res.data['status_history']
        self.assertGreaterEqual(len(history), 3)

        # Check each history item has action_label, updated_by_name and NO raw email in updated_by_name
        for h in history:
            self.assertIn('action_label', h)
            self.assertIn('updated_by_name', h)
            self.assertNotIn('@', h['updated_by_name'])

        # Event 1: Pending submitted by citizen
        pending_h = next(item for item in history if item['status'] == 'Pending')
        self.assertEqual(pending_h['updated_by_name'], 'Rahul Sharma')
        self.assertEqual(pending_h['action_label'], 'Submitted by Rahul Sharma')

        # Event 2: Awaiting Citizen Confirmation submitted by staff
        awaiting_h = next(item for item in history if item['status'] == 'Awaiting Citizen Confirmation')
        self.assertEqual(awaiting_h['updated_by_name'], 'Anjali Nair')
        self.assertEqual(awaiting_h['action_label'], 'Completion submitted by Anjali Nair')

        # Event 3: Resolved confirmed by citizen
        resolved_h = next(item for item in history if item['status'] == 'Resolved')
        self.assertEqual(resolved_h['updated_by_name'], 'Rahul Sharma')
        self.assertEqual(resolved_h['action_label'], 'Confirmed by Rahul Sharma')

    def test_cannot_submit_completion_when_already_awaiting_confirmation(self):
        """
        Verify staff cannot submit completion when the complaint is already Awaiting Citizen Confirmation.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'Awaiting Citizen Confirmation'
        self.complaint.save()

        self.client.force_authenticate(user=self.staff1_user)
        res = self.client.post(f'/api/complaints/{self.complaint.id}/complete/', {
            'completion_remarks': 'Trying to submit again'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already awaiting citizen confirmation', res.data.get('error', ''))

    def test_assignment_does_not_create_resolved_history_record(self):
        """
        Verify department/staff assignment keeps status Pending and does not create false Resolved history.
        """
        self.client.force_authenticate(user=self.auth_user)
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id, self.staff2.id],
            'remarks': 'Assigned to Sanitation Department with 2 staff member(s).'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Pending')

        # Verify no history record has status='Resolved'
        resolved_histories = self.complaint.status_history.filter(status='Resolved')
        self.assertEqual(resolved_histories.count(), 0)

        # Verify assignment record has status='Pending' and correct actor
        assignment_h = self.complaint.status_history.filter(remarks__icontains='Assigned to Sanitation').first()
        self.assertIsNotNone(assignment_h)
        self.assertEqual(assignment_h.status, 'Pending')
        self.assertEqual(assignment_h.updated_by, self.auth_user)

    def test_repeated_identical_assignment_does_not_create_duplicate_history(self):
        """
        Verify repeated clicks or identical assignment requests do not create duplicate history entries.
        """
        self.client.force_authenticate(user=self.auth_user)
        payload = {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id],
            'remarks': 'Assigned to Sanitation Department with 1 staff member(s).'
        }

        # First assignment
        res1 = self.client.patch(f'/api/complaints/{self.complaint.id}/', payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        count_after_first = self.complaint.status_history.count()

        # Repeated identical assignment
        res2 = self.client.patch(f'/api/complaints/{self.complaint.id}/', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        count_after_second = self.complaint.status_history.count()

        self.assertEqual(count_after_first, count_after_second)

    def test_cannot_directly_patch_status_to_resolved(self):
        """
        Verify neither staff nor municipal authority can directly PATCH status to Resolved.
        Only citizen confirmation may resolve a complaint.
        """
        self.complaint.department = self.sanitation_dept
        self.complaint.save()
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)

        # Staff attempts PATCH status to Resolved
        self.client.force_authenticate(user=self.staff1_user)
        res_staff = self.client.patch(f'/api/complaints/{self.complaint.id}/', {'status': 'Resolved'}, format='json')
        self.assertEqual(res_staff.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot mark a complaint as Resolved directly', res_staff.data.get('error', ''))

        # Authority attempts PATCH status to Resolved
        self.client.force_authenticate(user=self.auth_user)
        res_auth = self.client.patch(f'/api/complaints/{self.complaint.id}/', {'status': 'Resolved'}, format='json')
        self.assertEqual(res_auth.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot be marked as Resolved directly', res_auth.data.get('error', ''))

    def test_duplicate_citizen_confirmation_prevented(self):
        """
        Verify duplicate citizen confirmation requests are rejected and do not create duplicate Resolved history entries.
        """
        ComplaintAssignment.objects.create(complaint=self.complaint, staff=self.staff1, assigned_by=self.auth_user, is_active=True)
        self.complaint.department = self.sanitation_dept
        self.complaint.status = 'Awaiting Citizen Confirmation'
        self.complaint.save()

        ComplaintCompletion.objects.create(
            complaint=self.complaint,
            submitted_by=self.staff1_user,
            completion_remarks="Work finished.",
            citizen_response='Pending'
        )

        self.client.force_authenticate(user=self.citizen_user)

        # First confirmation
        res1 = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'confirm'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Resolved')
        resolved_count = self.complaint.status_history.filter(status='Resolved').count()
        self.assertEqual(resolved_count, 1)

        # Duplicate second confirmation
        res2 = self.client.post(f'/api/complaints/{self.complaint.id}/citizen-confirm/', {'action': 'confirm'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # Ensure still only 1 Resolved history entry
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status_history.filter(status='Resolved').count(), 1)

    def test_staff_filtering_by_department_and_active_status(self):
        """
        Verify /api/staff/ filters correctly by department and is_active query parameters.
        """
        self.client.force_authenticate(user=self.auth_user)

        # Query staff for sanitation department
        res_sanitation = self.client.get(f'/api/staff/?department={self.sanitation_dept.id}')
        self.assertEqual(res_sanitation.status_code, status.HTTP_200_OK)
        for s in res_sanitation.data:
            self.assertEqual(s['department'], self.sanitation_dept.id)

        # Deactivate staff2
        self.staff2_user.is_active = False
        self.staff2_user.save()

        # Query active staff only
        res_active = self.client.get(f'/api/staff/?department={self.sanitation_dept.id}&is_active=true')
        self.assertEqual(res_active.status_code, status.HTTP_200_OK)
        active_ids = [s['id'] for s in res_active.data]
        self.assertIn(self.staff1.id, active_ids)
        self.assertNotIn(self.staff2.id, active_ids)

        # Query inactive staff only
        res_inactive = self.client.get(f'/api/staff/?department={self.sanitation_dept.id}&is_active=false')
        self.assertEqual(res_inactive.status_code, status.HTTP_200_OK)
        inactive_ids = [s['id'] for s in res_inactive.data]
        self.assertIn(self.staff2.id, inactive_ids)
        self.assertNotIn(self.staff1.id, inactive_ids)

    def test_inactive_staff_cannot_be_assigned_to_complaint(self):
        """
        Verify that attempting to assign an inactive staff member is rejected with 400 Bad Request.
        """
        self.client.force_authenticate(user=self.auth_user)

        # Deactivate staff2
        self.staff2_user.is_active = False
        self.staff2_user.save()

        payload = {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id, self.staff2.id],
            'remarks': 'Assigning staff including an inactive user'
        }
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot assign inactive staff members', res.data.get('error', ''))

    def test_each_staff_member_sees_only_assigned_complaints(self):
        """
        Verify each staff member can log in and sees only complaints assigned to them.
        """
        # Create second complaint
        c2 = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Garbage',
            description='Second complaint',
            location='Location 2',
            department=self.sanitation_dept,
            status='In Progress'
        )

        # Complaint 1 is assigned to staff 1
        ComplaintAssignment.objects.create(
            complaint=self.complaint,
            staff=self.staff1,
            assigned_by=self.auth_user,
            is_active=True
        )

        # Complaint 2 is assigned to staff 2
        ComplaintAssignment.objects.create(
            complaint=c2,
            staff=self.staff2,
            assigned_by=self.auth_user,
            is_active=True
        )

        # Authenticate as Staff 1
        self.client.force_authenticate(user=self.staff1_user)
        res1 = self.client.get('/api/complaints/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        c_ids1 = [c['id'] for c in res1.data]
        self.assertIn(self.complaint.id, c_ids1)
        self.assertNotIn(c2.id, c_ids1)

        # Authenticate as Staff 2
        self.client.force_authenticate(user=self.staff2_user)
        res2 = self.client.get('/api/complaints/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        c_ids2 = [c['id'] for c in res2.data]
        self.assertIn(c2.id, c_ids2)
        self.assertNotIn(self.complaint.id, c_ids2)

    # ==================== AUTHORITY REJECTION & WORKFLOW TESTS ====================

    def test_citizen_submits_complaint_initial_status_pending(self):
        """Scenario 1: Citizen submits a complaint and its initial status is Pending."""
        self.client.force_authenticate(user=self.citizen_user)
        payload = {
            'description': 'Broken streetlight near Community Hall.',
            'location': 'Community Hall, Aluva',
            'latitude': '10.107600',
            'longitude': '76.351600',
            'category': 'Other'
        }
        res = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'Pending')
        self.assertEqual(res.data['citizen_name'], 'Rahul Sharma')

        # Check initial history
        c_id = res.data['id']
        complaint_obj = Complaint.objects.get(id=c_id)
        first_hist = complaint_obj.status_history.first()
        self.assertIsNotNone(first_hist)
        self.assertEqual(first_hist.status, 'Pending')
        self.assertEqual(first_hist.updated_by, self.citizen_user)

    def test_assignment_does_not_change_status_from_pending(self):
        """Scenario 3: Authority assigns department and staff; status remains Pending."""
        self.client.force_authenticate(user=self.auth_user)
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Pending')
        self.assertEqual(self.complaint.department, self.sanitation_dept)

    def test_authority_rejects_unassigned_pending_complaint(self):
        """Scenario 4: Authority can reject an unassigned Pending complaint with a valid reason."""
        self.client.force_authenticate(user=self.auth_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': 'Duplicate complaint: issue already reported under #42.'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Rejected')
        self.assertEqual(self.complaint.rejection_reason, 'Duplicate complaint: issue already reported under #42.')
        self.assertEqual(self.complaint.rejected_by, self.auth_user)
        self.assertIsNotNone(self.complaint.rejected_at)

    def test_rejection_without_reason_fails(self):
        """Scenario 5: Rejection without a reason is rejected with 400 Bad Request."""
        self.client.force_authenticate(user=self.auth_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': ''},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('A rejection reason is required', res.data.get('error', ''))

    def test_rejection_records_identity_timestamp_reason(self):
        """Scenario 6: Rejection records authority identity, exact timestamp, and reason."""
        self.client.force_authenticate(user=self.auth_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': 'Outside municipal responsibility: private property.'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.rejected_by, self.auth_user)
        self.assertIsNotNone(self.complaint.rejected_at)
        self.assertEqual(self.complaint.rejection_reason, 'Outside municipal responsibility: private property.')

        # Check status history
        hist = self.complaint.status_history.filter(status='Rejected').first()
        self.assertIsNotNone(hist)
        self.assertEqual(hist.updated_by, self.auth_user)
        self.assertIn('Outside municipal responsibility', hist.remarks)

    def test_citizen_receives_rejection_notification(self):
        """Scenario 7: Citizen receives and can view the rejection notification."""
        self.client.force_authenticate(user=self.auth_user)
        self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': 'False or misleading information.'},
            format='json'
        )

        notif = Notification.objects.filter(user=self.citizen_user, complaint=self.complaint).first()
        self.assertIsNotNone(notif)
        self.assertIn('Rejected', notif.title)
        self.assertIn('False or misleading information', notif.message)

    def test_authority_cannot_reject_complaint_after_assignment(self):
        """Scenario 8: Authority cannot reject a complaint after it has been assigned."""
        self.complaint.department = self.sanitation_dept
        self.complaint.save()
        ComplaintAssignment.objects.create(
            complaint=self.complaint,
            staff=self.staff1,
            assigned_by=self.auth_user,
            is_active=True
        )

        self.client.force_authenticate(user=self.auth_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': 'Attempting rejection after assignment'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been assigned', res.data.get('error', ''))

    def test_authority_cannot_reject_non_pending_complaint(self):
        """Scenario 9: Authority cannot reject complaints that are no longer Pending."""
        self.complaint.status = 'In Progress'
        self.complaint.save()

        self.client.force_authenticate(user=self.auth_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': 'Attempting rejection on In Progress'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('only be rejected while in Pending status', res.data.get('error', ''))

    def test_department_staff_cannot_reject_complaint(self):
        """Scenario 10: Department staff cannot reject complaints."""
        self.client.force_authenticate(user=self.staff1_user)
        res = self.client.post(
            f'/api/complaints/{self.complaint.id}/reject/',
            {'rejection_reason': 'Staff trying to reject'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_start_work_only_on_assigned_complaint(self):
        """Scenario 11: Department staff can start work only on complaints assigned to them."""
        self.complaint.department = self.sanitation_dept
        self.complaint.save()
        # Complaint assigned to staff 1
        ComplaintAssignment.objects.create(
            complaint=self.complaint,
            staff=self.staff1,
            assigned_by=self.auth_user,
            is_active=True
        )

        # Unassigned staff 2 tries to start work -> Forbidden (403)
        self.client.force_authenticate(user=self.staff2_user)
        res_unassigned = self.client.post(f'/api/complaints/{self.complaint.id}/start-work/')
        self.assertEqual(res_unassigned.status_code, status.HTTP_403_FORBIDDEN)

        # Assigned staff 1 starts work -> Success (200) and status moves to In Progress
        self.client.force_authenticate(user=self.staff1_user)
        res_assigned = self.client.post(f'/api/complaints/{self.complaint.id}/start-work/')
        self.assertEqual(res_assigned.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'In Progress')

        # Calling start-work again while already In Progress does not create duplicate history
        hist_count_before = self.complaint.status_history.count()
        res_again = self.client.post(f'/api/complaints/{self.complaint.id}/start-work/')
        self.assertEqual(res_again.status_code, status.HTTP_200_OK)
        hist_count_after = self.complaint.status_history.count()
        self.assertEqual(hist_count_before, hist_count_after)

    def test_assignment_does_not_create_false_status_changes(self):
        """Scenario 19: Assignment events do not create false status changes."""
        self.client.force_authenticate(user=self.auth_user)
        res = self.client.patch(f'/api/complaints/{self.complaint.id}/', {
            'department': self.sanitation_dept.id,
            'assigned_staff_ids': [self.staff1.id]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, 'Pending')

        # Ensure no In Progress or Resolved history was fabricated
        false_histories = self.complaint.status_history.filter(status__in=['In Progress', 'Resolved'])
        self.assertEqual(false_histories.count(), 0)

    def test_existing_complaint_records_and_history_remain_intact(self):
        """Scenario 20: Existing complaint records and history remain intact."""
        initial_history_count = self.complaint.status_history.count()
        self.assertGreaterEqual(initial_history_count, 1)

        # Retrieve complaint details via API
        self.client.force_authenticate(user=self.citizen_user)
        res = self.client.get(f'/api/complaints/{self.complaint.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['id'], self.complaint.id)
        self.assertEqual(res.data['description'], self.complaint.description)
        self.assertEqual(len(res.data['status_history']), initial_history_count)


