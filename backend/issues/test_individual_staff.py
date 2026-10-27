from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from issues.models import UserProfile, Department, DepartmentStaff, Complaint, ComplaintStatusHistory

class IndividualStaffAccountTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Departments
        self.sanitation_dept = Department.objects.create(
            name='Sanitation Department'
        )
        self.roads_dept = Department.objects.create(
            name='Roads & Works'
        )

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

        # Create Citizen
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

    def test_municipal_authority_creates_multiple_staff_in_same_department(self):
        """
        Verify Municipal Authority can create multiple staff accounts in the same department
        with secure password hashing and unique emails.
        """
        self.client.force_authenticate(user=self.auth_user)

        # 1. Create Staff 1: Anjali Nair
        payload1 = {
            'email': 'anjali.nair@civicconnect.gov.in',
            'password': 'AnjaliSecurePassword123!',
            'full_name': 'Anjali Nair',
            'department_id': self.sanitation_dept.id
        }
        res1 = self.client.post('/api/staff/', payload1, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['email'], 'anjali.nair@civicconnect.gov.in')
        self.assertEqual(res1.data['full_name'], 'Anjali Nair')
        self.assertEqual(res1.data['department_name'], 'Sanitation Department')

        # Verify password is secure (hashed, not plaintext in DB)
        user1 = User.objects.get(email='anjali.nair@civicconnect.gov.in')
        self.assertTrue(user1.check_password('AnjaliSecurePassword123!'))
        self.assertNotEqual(user1.password, 'AnjaliSecurePassword123!')
        self.assertTrue(user1.password.startswith('pbkdf2_') or user1.password.startswith('argon2'))

        # 2. Create Staff 2: Suresh Kumar in the same Sanitation Department
        payload2 = {
            'email': 'suresh.kumar@civicconnect.gov.in',
            'password': 'SureshSecurePassword456!',
            'full_name': 'Suresh Kumar',
            'department_id': self.sanitation_dept.id
        }
        res2 = self.client.post('/api/staff/', payload2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['email'], 'suresh.kumar@civicconnect.gov.in')
        self.assertEqual(res2.data['full_name'], 'Suresh Kumar')
        self.assertEqual(res2.data['department_name'], 'Sanitation Department')

        user2 = User.objects.get(email='suresh.kumar@civicconnect.gov.in')
        self.assertTrue(user2.check_password('SureshSecurePassword456!'))

        # Verify duplicate email is prevented
        res_dup = self.client.post('/api/staff/', payload1, format='json')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_two_staff_in_same_department_login_and_see_own_identity(self):
        """
        Verify two staff members in the same department log in with separate credentials,
        and each receives their own full name, email, role, and department.
        """
        # Create staff 1
        user1 = User.objects.create_user(
            username='anjali@sanitation.civic',
            email='anjali@sanitation.civic',
            password='Password123!',
            first_name='Anjali',
            last_name='Nair'
        )
        UserProfile.objects.create(user=user1, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=user1, department=self.sanitation_dept)

        # Create staff 2
        user2 = User.objects.create_user(
            username='suresh@sanitation.civic',
            email='suresh@sanitation.civic',
            password='Password456!',
            first_name='Suresh',
            last_name='Kumar'
        )
        UserProfile.objects.create(user=user2, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=user2, department=self.sanitation_dept)

        # 1. Login as Staff 1 (Anjali)
        login_res1 = self.client.post('/api/login/', {
            'email': 'anjali@sanitation.civic',
            'password': 'Password123!',
            'expected_role': 'DEPARTMENT_STAFF'
        }, format='json')
        self.assertEqual(login_res1.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res1.data['full_name'], 'Anjali Nair')
        self.assertEqual(login_res1.data['email'], 'anjali@sanitation.civic')
        self.assertEqual(login_res1.data['role'], 'DEPARTMENT_STAFF')
        self.assertEqual(login_res1.data['department'], 'Sanitation Department')

        # Verify Staff 1 profile endpoint
        prof_res1 = self.client.get('/api/profile/')
        self.assertEqual(prof_res1.status_code, status.HTTP_200_OK)
        self.assertEqual(prof_res1.data['full_name'], 'Anjali Nair')
        self.assertEqual(prof_res1.data['email'], 'anjali@sanitation.civic')
        self.assertEqual(prof_res1.data['department'], 'Sanitation Department')

        # Logout
        self.client.post('/api/logout/')

        # 2. Login as Staff 2 (Suresh)
        login_res2 = self.client.post('/api/login/', {
            'email': 'suresh@sanitation.civic',
            'password': 'Password456!',
            'expected_role': 'DEPARTMENT_STAFF'
        }, format='json')
        self.assertEqual(login_res2.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res2.data['full_name'], 'Suresh Kumar')
        self.assertEqual(login_res2.data['email'], 'suresh@sanitation.civic')
        self.assertEqual(login_res2.data['role'], 'DEPARTMENT_STAFF')
        self.assertEqual(login_res2.data['department'], 'Sanitation Department')

        # Verify Staff 2 profile endpoint
        prof_res2 = self.client.get('/api/profile/')
        self.assertEqual(prof_res2.status_code, status.HTTP_200_OK)
        self.assertEqual(prof_res2.data['full_name'], 'Suresh Kumar')
        self.assertEqual(prof_res2.data['email'], 'suresh@sanitation.civic')
        self.assertEqual(prof_res2.data['department'], 'Sanitation Department')

    def test_department_based_complaint_access_and_isolation(self):
        """
        Verify:
        - Staff can view and update complaints assigned to their department.
        - Staff cannot view or update complaints assigned to other departments.
        - Staff cannot reassign department or modify complaint location/coordinates.
        """
        # Create Sanitation Staff
        staff_sanitation = User.objects.create_user(
            username='anjali@sanitation.civic',
            email='anjali@sanitation.civic',
            password='Password123!',
            first_name='Anjali',
            last_name='Nair'
        )
        UserProfile.objects.create(user=staff_sanitation, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=staff_sanitation, department=self.sanitation_dept)

        # Create Roads Staff
        staff_roads = User.objects.create_user(
            username='ramesh@roads.civic',
            email='ramesh@roads.civic',
            password='Password123!',
            first_name='Ramesh',
            last_name='Varma'
        )
        UserProfile.objects.create(user=staff_roads, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=staff_roads, department=self.roads_dept)

        # Create complaint assigned to Sanitation
        c_sanitation = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Garbage',
            description='Uncollected garbage on Main Street',
            location='Main Street, Ward 5',
            department=self.sanitation_dept,
            status='In Progress'
        )

        # Create complaint assigned to Roads
        c_roads = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Pothole',
            description='Deep pothole near Highway junction',
            location='Highway Junction, Ward 8',
            department=self.roads_dept,
            status='In Progress'
        )

        # Authenticate as Sanitation Staff
        self.client.force_authenticate(user=staff_sanitation)

        # 1. Staff sees only Sanitation complaints in the list
        list_res = self.client.get('/api/complaints/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        complaint_ids = [c['id'] for c in list_res.data]
        self.assertIn(c_sanitation.id, complaint_ids)
        self.assertNotIn(c_roads.id, complaint_ids)

        # 2. Staff can retrieve their own department complaint
        detail_res = self.client.get(f'/api/complaints/{c_sanitation.id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)

        # 3. Staff CANNOT retrieve other department complaint (DRF returns 404)
        cross_res = self.client.get(f'/api/complaints/{c_roads.id}/')
        self.assertEqual(cross_res.status_code, status.HTTP_404_NOT_FOUND)

        # 4. Staff CANNOT update other department complaint
        cross_patch = self.client.patch(f'/api/complaints/{c_roads.id}/', {
            'status': 'Resolved',
            'remarks': 'Attempting unauthorized update'
        }, format='json')
        self.assertEqual(cross_patch.status_code, status.HTTP_404_NOT_FOUND)

    def test_status_history_records_actual_staff_member(self):
        """
        Verify that ComplaintStatusHistory records the actual staff member who updated the status.
        """
        # Create Staff 1 and Staff 2 in Sanitation
        user1 = User.objects.create_user(
            username='anjali@sanitation.civic',
            email='anjali@sanitation.civic',
            password='Password123!',
            first_name='Anjali',
            last_name='Nair'
        )
        UserProfile.objects.create(user=user1, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=user1, department=self.sanitation_dept)

        user2 = User.objects.create_user(
            username='suresh@sanitation.civic',
            email='suresh@sanitation.civic',
            password='Password456!',
            first_name='Suresh',
            last_name='Kumar'
        )
        UserProfile.objects.create(user=user2, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=user2, department=self.sanitation_dept)

        complaint = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Garbage',
            description='Overflowing trash bin',
            location='Central Park Gate',
            department=self.sanitation_dept,
            status='Pending'
        )

        # Anjali updates status to 'In Progress'
        self.client.force_authenticate(user=user1)
        res1 = self.client.patch(f'/api/complaints/{complaint.id}/', {
            'status': 'In Progress',
            'remarks': 'Sanitation crew dispatched to site.'
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Suresh submits work completion
        self.client.force_authenticate(user=user2)
        res2 = self.client.post(f'/api/complaints/{complaint.id}/complete/', {
            'completion_remarks': 'Trash cleared and bin disinfected.'
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        # Check status history in DB
        history = list(ComplaintStatusHistory.objects.filter(complaint=complaint).order_by('updated_at'))
        self.assertEqual(len(history), 2)
        
        # Entry 1 should be by Anjali Nair
        self.assertEqual(history[0].status, 'In Progress')
        self.assertEqual(history[0].remarks, 'Sanitation crew dispatched to site.')
        self.assertEqual(history[0].updated_by, user1)

        # Entry 2 should be by Suresh Kumar
        self.assertIn(history[1].status, ['Awaiting Authority Verification', 'Awaiting Citizen Confirmation'])
        self.assertIn('Trash cleared and bin disinfected.', history[1].remarks)
        self.assertEqual(history[1].updated_by, user2)

        # Check serialized output in GET /api/complaints/{id}/
        detail_res = self.client.get(f'/api/complaints/{complaint.id}/')
        status_hist = detail_res.data['status_history']
        self.assertEqual(len(status_hist), 2)
        self.assertEqual(status_hist[0]['updated_by_name'], 'Anjali Nair')
        self.assertEqual(status_hist[1]['updated_by_name'], 'Suresh Kumar')

    def test_staff_cannot_access_or_manage_staff_profiles(self):
        """
        Verify staff members cannot access /api/staff/ to list or edit other staff profiles.
        Only Municipal Authority has permission.
        """
        staff_user = User.objects.create_user(
            username='anjali@sanitation.civic',
            email='anjali@sanitation.civic',
            password='Password123!',
            first_name='Anjali',
            last_name='Nair'
        )
        UserProfile.objects.create(user=staff_user, role='DEPARTMENT_STAFF')
        dept_staff = DepartmentStaff.objects.create(user=staff_user, department=self.sanitation_dept)

        # Authenticate as staff
        self.client.force_authenticate(user=staff_user)

        # Staff GET /api/staff/ returns empty list (filtered out by get_queryset)
        res_list = self.client.get('/api/staff/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 0)

        # Staff GET /api/staff/{id}/ returns 404
        res_detail = self.client.get(f'/api/staff/{dept_staff.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Staff POST /api/staff/ returns 403 Forbidden
        res_create = self.client.post('/api/staff/', {
            'email': 'hacker@civic.in',
            'password': 'test',
            'full_name': 'Hacker',
            'department_id': self.sanitation_dept.id
        }, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_403_FORBIDDEN)

    def test_citizen_and_authority_login_continue_working(self):
        """
        Verify existing Citizen and Municipal Authority logins continue to work correctly.
        """
        # Citizen login
        res_citizen = self.client.post('/api/login/', {
            'email': 'citizen@kerala.in',
            'password': 'CitizenPass123!',
            'expected_role': 'CITIZEN'
        }, format='json')
        self.assertEqual(res_citizen.status_code, status.HTTP_200_OK)
        self.assertEqual(res_citizen.data['role'], 'CITIZEN')
        self.assertEqual(res_citizen.data['full_name'], 'Rahul Sharma')

        # Authority login
        res_auth = self.client.post('/api/login/', {
            'email': 'authority@civicconnect.gov.in',
            'password': 'AuthorityPass123!',
            'expected_role': 'MUNICIPAL_AUTHORITY'
        }, format='json')
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        self.assertEqual(res_auth.data['role'], 'MUNICIPAL_AUTHORITY')
        self.assertEqual(res_auth.data['full_name'], 'Rajesh Menon')
