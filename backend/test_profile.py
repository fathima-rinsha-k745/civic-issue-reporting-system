from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from issues.models import UserProfile, Department, DepartmentStaff


class ProfileApiTests(APITestCase):
    """
    Automated test suite for Profile API endpoints (/api/profile/).
    Tests authenticated access, role permissions, unauthorized access,
    and profile updates without requiring a live external server.
    """

    def setUp(self):
        self.password = "password123"

        # Create Citizen User
        self.citizen_email = "citizen@example.com"
        self.citizen = User.objects.create_user(
            username=self.citizen_email,
            email=self.citizen_email,
            password=self.password,
            first_name="Citizen",
            last_name="User"
        )
        self.citizen_profile = UserProfile.objects.create(
            user=self.citizen,
            role="CITIZEN"
        )

        # Create Municipal Authority User
        self.auth_email = "authority@example.com"
        self.authority = User.objects.create_user(
            username=self.auth_email,
            email=self.auth_email,
            password=self.password,
            first_name="Municipal",
            last_name="Authority"
        )
        self.auth_profile = UserProfile.objects.create(
            user=self.authority,
            role="MUNICIPAL_AUTHORITY"
        )

        # Create Department and Department Staff User
        self.department = Department.objects.create(name="Sanitation")
        self.staff_email = "staff@example.com"
        self.staff = User.objects.create_user(
            username=self.staff_email,
            email=self.staff_email,
            password=self.password,
            first_name="Staff",
            last_name="Member"
        )
        self.staff_profile = UserProfile.objects.create(
            user=self.staff,
            role="DEPARTMENT_STAFF"
        )
        self.dept_staff = DepartmentStaff.objects.create(
            user=self.staff,
            department=self.department
        )

    def test_unauthenticated_profile_access(self):
        """Unauthenticated GET /api/profile/ must return 401 Unauthorized or 403 Forbidden."""
        response = self.client.get('/api/profile/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_unauthenticated_profile_update(self):
        """Unauthenticated PATCH /api/profile/ must return 401 Unauthorized or 403 Forbidden."""
        response = self.client.patch('/api/profile/', {'full_name': 'Unauthorized Hacker'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_citizen_profile_access(self):
        """Authenticated Citizen should get profile with role CITIZEN and department None."""
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('email'), self.citizen_email)
        self.assertEqual(response.data.get('full_name'), "Citizen User")
        self.assertEqual(response.data.get('role'), "CITIZEN")
        self.assertIsNone(response.data.get('department'))

    def test_authority_profile_access(self):
        """Authenticated Municipal Authority should get role MUNICIPAL_AUTHORITY and department None."""
        self.client.force_authenticate(user=self.authority)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('email'), self.auth_email)
        self.assertEqual(response.data.get('role'), "MUNICIPAL_AUTHORITY")
        self.assertIsNone(response.data.get('department'))

    def test_department_staff_profile_access(self):
        """Authenticated Department Staff should get role DEPARTMENT_STAFF and their department name."""
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('email'), self.staff_email)
        self.assertEqual(response.data.get('role'), "DEPARTMENT_STAFF")
        self.assertEqual(response.data.get('department'), "Sanitation")

    def test_profile_access_without_userprofile(self):
        """User without a UserProfile should default gracefully to role CITIZEN."""
        bare_user = User.objects.create_user(
            username="bare@example.com",
            email="bare@example.com",
            password="pass"
        )
        self.client.force_authenticate(user=bare_user)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('role'), "CITIZEN")
        self.assertIsNone(response.data.get('department'))

    def test_profile_update_full_name(self):
        """Updating full_name splits into first_name and last_name properly."""
        self.client.force_authenticate(user=self.citizen)
        response = self.client.patch('/api/profile/', {
            'full_name': 'Updated Citizen Name'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('full_name'), 'Updated Citizen Name')
        self.assertEqual(response.data.get('message'), 'Profile updated successfully.')

        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.first_name, 'Updated')
        self.assertEqual(self.citizen.last_name, 'Citizen Name')

    def test_profile_update_single_name(self):
        """Updating with a single name sets first_name and clears last_name."""
        self.client.force_authenticate(user=self.citizen)
        response = self.client.patch('/api/profile/', {
            'full_name': 'SingleName'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.first_name, 'SingleName')
        self.assertEqual(self.citizen.last_name, '')

    def test_profile_update_email_success(self):
        """Updating email updates both email and username."""
        self.client.force_authenticate(user=self.citizen)
        response = self.client.patch('/api/profile/', {
            'email': 'newcitizen@example.com'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('email'), 'newcitizen@example.com')

        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.email, 'newcitizen@example.com')
        self.assertEqual(self.citizen.username, 'newcitizen@example.com')

    def test_profile_update_duplicate_email(self):
        """Updating email to an existing user's email returns 400 Bad Request."""
        self.client.force_authenticate(user=self.citizen)
        response = self.client.patch('/api/profile/', {
            'email': self.auth_email
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], "Email is already in use by another account.")

    def test_login_and_get_update_profile_session_flow(self):
        """
        Reproduce original test_profile.py flow via test client:
        1. Login via /api/login/
        2. GET /api/profile/
        3. PATCH /api/profile/
        """
        # 1. Login
        login_response = self.client.post('/api/login/', {
            'email': self.citizen_email,
            'password': self.password,
            'expected_role': 'CITIZEN'
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data.get('role'), 'CITIZEN')

        # 2. Get Profile using session
        get_response = self.client.get('/api/profile/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data.get('email'), self.citizen_email)

        # 3. Update Profile using session
        update_response = self.client.patch('/api/profile/', {
            'full_name': 'Updated Citizen Name',
            'email': self.citizen_email
        }, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data.get('full_name'), 'Updated Citizen Name')
        self.assertEqual(update_response.data.get('message'), 'Profile updated successfully.')
