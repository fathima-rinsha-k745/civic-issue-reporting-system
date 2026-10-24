from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from issues.models import UserProfile, Department, DepartmentStaff, Complaint


class AnalyticsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Create Authority user
        self.auth_user = User.objects.create_user(
            username='auth_analytics@example.com',
            email='auth_analytics@example.com',
            password='testpassword'
        )
        self.auth_profile = UserProfile.objects.create(
            user=self.auth_user,
            role='MUNICIPAL_AUTHORITY'
        )

        # 2. Create Citizen user
        self.citizen_user = User.objects.create_user(
            username='citizen_analytics@example.com',
            email='citizen_analytics@example.com',
            password='testpassword'
        )
        self.citizen_profile = UserProfile.objects.create(
            user=self.citizen_user,
            role='CITIZEN'
        )

        # 3. Create Department and Staff user
        self.dept_sanitation = Department.objects.create(name='Sanitation')
        self.dept_roads = Department.objects.create(name='Roads')
        self.dept_water = Department.objects.create(name='Water Supply')

        self.staff_user = User.objects.create_user(
            username='staff_analytics@example.com',
            email='staff_analytics@example.com',
            password='testpassword'
        )
        self.staff_profile = UserProfile.objects.create(
            user=self.staff_user,
            role='DEPARTMENT_STAFF'
        )
        self.dept_staff = DepartmentStaff.objects.create(
            user=self.staff_user,
            department=self.dept_sanitation
        )

        # 4. Create sample complaints
        # Pending in Sanitation
        self.c1 = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Garbage',
            description='Test garbage overflow',
            location='Main St',
            status='Pending',
            department=self.dept_sanitation
        )
        # In Progress in Roads
        self.c2 = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Pothole',
            description='Test pothole',
            location='2nd Ave',
            status='In Progress',
            department=self.dept_roads
        )
        # Resolved in Sanitation
        self.c3 = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Garbage',
            description='Test resolved garbage',
            location='3rd Blvd',
            status='Resolved',
            department=self.dept_sanitation
        )
        # Rejected in Roads
        self.c4 = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Pothole',
            description='Test rejected pothole',
            location='4th Ln',
            status='Rejected',
            department=self.dept_roads
        )

    def test_unauthenticated_access_denied(self):
        """Unauthenticated requests must be denied."""
        response = self.client.get('/api/analytics/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_citizen_access_forbidden(self):
        """Citizens cannot access municipal authority analytics."""
        self.client.force_authenticate(user=self.citizen_user)
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_access_forbidden(self):
        """Department Staff cannot access municipal authority analytics."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authority_access_granted(self):
        """Municipal Authority can successfully access analytics."""
        self.client.force_authenticate(user=self.auth_user)
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('by_status', data)
        self.assertIn('daily_trend', data)
        self.assertIn('by_department', data)
        self.assertIn('total_complaints', data)
        self.assertEqual(data['total_complaints'], 4)

    def test_complaints_by_status(self):
        """Verify counts for all 5 required statuses."""
        self.client.force_authenticate(user=self.auth_user)
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        by_status = response.data['by_status']
        status_dict = {item['status']: item['count'] for item in by_status}

        self.assertIn('Pending', status_dict)
        self.assertIn('In Progress', status_dict)
        self.assertIn('Awaiting Citizen Confirmation', status_dict)
        self.assertIn('Resolved', status_dict)
        self.assertIn('Rejected', status_dict)

        self.assertEqual(status_dict['Pending'], 1)
        self.assertEqual(status_dict['In Progress'], 1)
        self.assertEqual(status_dict['Awaiting Citizen Confirmation'], 0)
        self.assertEqual(status_dict['Resolved'], 1)
        self.assertEqual(status_dict['Rejected'], 1)

    def test_department_wise_complaints(self):
        """Verify real department counts from database."""
        self.client.force_authenticate(user=self.auth_user)
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        by_dept = response.data['by_department']
        dept_dict = {item['name']: item['count'] for item in by_dept}

        self.assertEqual(dept_dict.get('Sanitation'), 2)
        self.assertEqual(dept_dict.get('Roads'), 2)
        self.assertEqual(dept_dict.get('Water Supply'), 0)

    def test_daily_complaints_trend_filters(self):
        """Verify Last 7 Days and Last 30 Days trend filters."""
        self.client.force_authenticate(user=self.auth_user)

        # Default or days=7
        res7 = self.client.get('/api/analytics/?days=7')
        self.assertEqual(res7.status_code, status.HTTP_200_OK)
        self.assertEqual(res7.data['trend_days'], 7)
        self.assertEqual(len(res7.data['daily_trend']), 7)

        # All 4 complaints were created today, so today's count should be 4
        today_date = timezone.localdate().strftime('%Y-%m-%d')
        today_entry = next((d for d in res7.data['daily_trend'] if d['date'] == today_date), None)
        self.assertIsNotNone(today_entry)
        self.assertEqual(today_entry['count'], 4)

        # days=30
        res30 = self.client.get('/api/analytics/?days=30')
        self.assertEqual(res30.status_code, status.HTTP_200_OK)
        self.assertEqual(res30.data['trend_days'], 30)
        self.assertEqual(len(res30.data['daily_trend']), 30)

        today_entry_30 = next((d for d in res30.data['daily_trend'] if d['date'] == today_date), None)
        self.assertIsNotNone(today_entry_30)
        self.assertEqual(today_entry_30['count'], 4)
