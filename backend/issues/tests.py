from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserProfile, Department, DepartmentStaff, Complaint

class ComplaintLocationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Citizen
        self.citizen_user = User.objects.create_user(
            username='citizen@test.com',
            email='citizen@test.com',
            password='password123',
            first_name='Citizen',
            last_name='Tester'
        )
        self.citizen_profile = UserProfile.objects.create(
            user=self.citizen_user,
            role='CITIZEN'
        )

        # Create Department
        self.dept = Department.objects.create(name='Public Works')

        # Create Staff
        self.staff_user = User.objects.create_user(
            username='staff@test.com',
            email='staff@test.com',
            password='password123',
            first_name='Staff',
            last_name='Tester'
        )
        self.staff_profile = UserProfile.objects.create(
            user=self.staff_user,
            role='DEPARTMENT_STAFF'
        )
        self.dept_staff = DepartmentStaff.objects.create(
            user=self.staff_user,
            department=self.dept
        )

        # Create Authority
        self.auth_user = User.objects.create_user(
            username='auth@test.com',
            email='auth@test.com',
            password='password123',
            first_name='Authority',
            last_name='Tester'
        )
        self.auth_profile = UserProfile.objects.create(
            user=self.auth_user,
            role='MUNICIPAL_AUTHORITY'
        )

    def test_submit_complaint_with_valid_coordinates(self):
        self.client.force_authenticate(user=self.citizen_user)
        payload = {
            'description': 'Pothole near MG Road',
            'location': 'MG Road, Kochi',
            'category': 'Pothole',
            'latitude': 9.931234,
            'longitude': 76.267301
        }
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('latitude', response.data)
        self.assertIn('longitude', response.data)
        self.assertEqual(Decimal(str(response.data['latitude'])), Decimal('9.931234'))
        self.assertEqual(Decimal(str(response.data['longitude'])), Decimal('76.267301'))

        # Verify DB
        complaint = Complaint.objects.get(id=response.data['id'])
        self.assertEqual(complaint.latitude, Decimal('9.931234'))
        self.assertEqual(complaint.longitude, Decimal('76.267301'))
        self.assertEqual(complaint.citizen, self.citizen_user)

    def test_submit_complaint_without_coordinates(self):
        self.client.force_authenticate(user=self.citizen_user)
        payload = {
            'description': 'Broken streetlight without GPS',
            'location': 'Main Bazaar',
            'category': 'Broken Streetlight'
        }
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['latitude'])
        self.assertIsNone(response.data['longitude'])

        complaint = Complaint.objects.get(id=response.data['id'])
        self.assertIsNone(complaint.latitude)
        self.assertIsNone(complaint.longitude)

    def test_reject_invalid_latitude_out_of_bounds(self):
        self.client.force_authenticate(user=self.citizen_user)
        payload = {
            'description': 'Out of bounds lat',
            'location': 'Invalid Location',
            'category': 'Other',
            'latitude': 95.0,
            'longitude': 76.0
        }
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('latitude', response.data)

        # Test negative out of bounds
        payload['latitude'] = -95.0
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_invalid_longitude_out_of_bounds(self):
        self.client.force_authenticate(user=self.citizen_user)
        payload = {
            'description': 'Out of bounds lon',
            'location': 'Invalid Location',
            'category': 'Other',
            'latitude': 10.0,
            'longitude': 185.0
        }
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('longitude', response.data)

        # Test negative out of bounds
        payload['longitude'] = -190.0
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_invalid_non_numeric_coordinates(self):
        self.client.force_authenticate(user=self.citizen_user)
        payload = {
            'description': 'Bad string coords',
            'location': 'Invalid Location',
            'category': 'Other',
            'latitude': 'invalid_lat',
            'longitude': 76.0
        }
        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_department_staff_cannot_modify_complaint_location(self):
        # Create complaint assigned to staff dept
        complaint = Complaint.objects.create(
            citizen=self.citizen_user,
            category='Pothole',
            description='Original pothole',
            location='Original Location 123',
            latitude=Decimal('10.000000'),
            longitude=Decimal('76.000000'),
            department=self.dept,
            status='In Progress'
        )

        self.client.force_authenticate(user=self.staff_user)
        # Attempt to tamper with location coordinates while updating status
        payload = {
            'status': 'In Progress',
            'location': 'Tampered Location',
            'latitude': 11.111111,
            'longitude': 77.777777,
            'remarks': 'Work finished'
        }
        response = self.client.patch(f'/api/complaints/{complaint.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        complaint.refresh_from_db()
        self.assertEqual(complaint.status, 'In Progress')
        # Location and coordinates must remain untouched!
        self.assertEqual(complaint.location, 'Original Location 123')
        self.assertEqual(complaint.latitude, Decimal('10.000000'))
        self.assertEqual(complaint.longitude, Decimal('76.000000'))

