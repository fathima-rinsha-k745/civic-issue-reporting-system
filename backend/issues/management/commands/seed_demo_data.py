import os
import shutil
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from issues.models import UserProfile, Department, DepartmentStaff, Complaint, ComplaintStatusHistory
from django.core.files import File

class Command(BaseCommand):
    help = 'Seeds the database with realistic demonstration data for CivicConnect'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting demo data seeding...')
        
        # 1. Create or get demo users
        citizen_user, _ = User.objects.get_or_create(username='citizen@example.com', defaults={'email': 'citizen@example.com'})
        citizen_user.set_password('demo123')
        citizen_user.first_name = "Demo"
        citizen_user.last_name = "Citizen"
        citizen_user.save()
        UserProfile.objects.get_or_create(user=citizen_user, defaults={'role': 'CITIZEN'})

        authority_user, _ = User.objects.get_or_create(username='authority@example.com', defaults={'email': 'authority@example.com'})
        authority_user.set_password('demo123')
        authority_user.first_name = "Municipal"
        authority_user.last_name = "Authority"
        authority_user.save()
        UserProfile.objects.get_or_create(user=authority_user, defaults={'role': 'MUNICIPAL_AUTHORITY'})

        # 2. Define Departments and Staff
        depts = [
            {'name': 'Sanitation Department', 'staff_username': 'staff_sanitation', 'first': 'Sani', 'last': 'Staff'},
            {'name': 'Public Works Department', 'staff_username': 'staff_pwd', 'first': 'Works', 'last': 'Staff'},
            {'name': 'Water Supply Department', 'staff_username': 'staff_water', 'first': 'Water', 'last': 'Staff'},
            {'name': 'Electrical Department', 'staff_username': 'staff_electrical', 'first': 'Elec', 'last': 'Staff'},
            {'name': 'Drainage Department', 'staff_username': 'staff_drainage', 'first': 'Drain', 'last': 'Staff'},
            {'name': 'Parks and Public Spaces Department', 'staff_username': 'staff_parks', 'first': 'Parks', 'last': 'Staff'},
        ]

        departments_map = {}
        staff_map = {}

        for d in depts:
            dept, _ = Department.objects.get_or_create(name=d['name'])
            departments_map[d['name']] = dept

            staff_user, _ = User.objects.get_or_create(username=f"{d['staff_username']}@example.com", defaults={'email': f"{d['staff_username']}@example.com"})
            staff_user.set_password('demo123')
            staff_user.first_name = d['first']
            staff_user.last_name = d['last']
            staff_user.save()
            
            UserProfile.objects.get_or_create(user=staff_user, defaults={'role': 'DEPARTMENT_STAFF'})
            staff, _ = DepartmentStaff.objects.get_or_create(user=staff_user, defaults={'department': dept})
            if staff.department != dept:
                staff.department = dept
                staff.save()
            staff_map[d['name']] = staff

        # 3. Create Sample Complaints
        complaints_data = [
            {
                'desc': 'Garbage overflowing near a residential area', 'cat': 'Garbage', 'loc': 'Sector 4, Residential Layout', 
                'dept': 'Sanitation Department', 'status': 'Pending', 'img': 'garbage.jpg'
            },
            {
                'desc': 'Large pothole on a main road', 'cat': 'Pothole', 'loc': 'MG Road, near City Center', 
                'dept': 'Public Works Department', 'status': 'In Progress', 'img': 'pothole.jpg'
            },
            {
                'desc': 'Water leakage from a public pipeline', 'cat': 'Water Leakage', 'loc': 'Gandhi Nagar, Block B', 
                'dept': 'Water Supply Department', 'status': 'Pending', 'img': 'leakage.jpg'
            },
            {
                'desc': 'Streetlight not working at night', 'cat': 'Broken Streetlight', 'loc': 'Park Avenue, Street 12', 
                'dept': 'Electrical Department', 'status': 'Resolved', 'img': 'streetlight.jpg'
            },
            {
                'desc': 'Blocked drainage causing water accumulation', 'cat': 'Drain Blockage', 'loc': 'Commercial Street, South End', 
                'dept': 'Drainage Department', 'status': 'In Progress', 'img': 'drain.jpg'
            },
            {
                'desc': 'Sewage overflowing onto a road', 'cat': 'Sewage Overflow', 'loc': 'Station Road, near Market', 
                'dept': 'Drainage Department', 'status': 'Pending', 'img': 'drain.jpg'
            },
            {
                'desc': 'Fallen tree blocking a road', 'cat': 'Fallen Tree', 'loc': 'Hilltop Route, Curve 3', 
                'dept': 'Public Works Department', 'status': 'Resolved', 'img': 'bench.jpg' # Using bench/park as a proxy if no tree img
            },
            {
                'desc': 'Damaged public park bench', 'cat': 'Public Property Damage', 'loc': 'Central Park, North Gate', 
                'dept': 'Parks and Public Spaces Department', 'status': 'Pending', 'img': 'bench.jpg'
            },
            {
                'desc': 'Irregular garbage collection', 'cat': 'Garbage', 'loc': 'Westside Apartments, Gate 2', 
                'dept': 'Sanitation Department', 'status': 'In Progress', 'img': 'garbage.jpg'
            },
            {
                'desc': 'Broken road pavement near a school', 'cat': 'Other', 'loc': 'St. Mary School Road', 
                'dept': 'Public Works Department', 'status': 'Pending', 'img': 'pothole.jpg'
            },
            {
                'desc': 'Leaking public water tap', 'cat': 'Water Leakage', 'loc': 'Community Hall, East Wing', 
                'dept': 'Water Supply Department', 'status': 'Resolved', 'img': 'leakage.jpg'
            },
            {
                'desc': 'Damaged public dustbin', 'cat': 'Public Property Damage', 'loc': 'Main Bus Stand, Platform 1', 
                'dept': 'Sanitation Department', 'status': 'In Progress', 'img': 'garbage.jpg'
            },
        ]

        demo_assets_dir = os.path.join(settings.BASE_DIR, 'demo_assets')
        
        # We ensure complaints aren't duplicated by checking descriptions for this demo user
        for cdata in complaints_data:
            complaint, created = Complaint.objects.get_or_create(
                citizen=citizen_user,
                description=cdata['desc'],
                defaults={
                    'category': cdata['cat'],
                    'location': cdata['loc'],
                    'status': cdata['status'],
                    'department': departments_map.get(cdata['dept']),
                    'assigned_staff': staff_map.get(cdata['dept']) if cdata['status'] != 'Pending' else None,
                }
            )

            if created:
                # Add image if exists in demo_assets
                img_path = os.path.join(demo_assets_dir, cdata['img'])
                if os.path.exists(img_path):
                    with open(img_path, 'rb') as f:
                        complaint.image.save(cdata['img'], File(f), save=True)
                
                # Add status history
                ComplaintStatusHistory.objects.create(
                    complaint=complaint,
                    status='Pending',
                    remarks='Complaint submitted by citizen.',
                    updated_by=citizen_user
                )

                if cdata['status'] in ['In Progress', 'Resolved']:
                    ComplaintStatusHistory.objects.create(
                        complaint=complaint,
                        status='In Progress',
                        remarks='Department staff is investigating the issue.',
                        updated_by=staff_map[cdata['dept']].user
                    )
                
                if cdata['status'] == 'Resolved':
                    ComplaintStatusHistory.objects.create(
                        complaint=complaint,
                        status='Resolved',
                        remarks='Issue has been fixed successfully.',
                        updated_by=staff_map[cdata['dept']].user
                    )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo data!'))
