import os
import json
import shutil
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.core.serializers import serialize
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from issues.models import (
    Complaint, Department, DepartmentStaff, UserProfile,
    ComplaintAssignment, ComplaintCompletion, ComplaintFeedback,
    ComplaintStatusHistory, Notification
)

class Command(BaseCommand):
    help = 'Seeds realistic demonstration complaints for CivicConnect across all departments and statuses'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting CivicConnect sample complaints seeding...'))

        # =====================================================================
        # Step 1: Backup existing complaints data
        # =====================================================================
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'complaints_backup_{timestamp_str}.json')

        backup_payload = {
            'timestamp': timezone.now().isoformat(),
            'complaints': json.loads(serialize('json', Complaint.objects.all())),
            'completions': json.loads(serialize('json', ComplaintCompletion.objects.all())),
            'feedbacks': json.loads(serialize('json', ComplaintFeedback.objects.all())),
            'assignments': json.loads(serialize('json', ComplaintAssignment.objects.all())),
            'history': json.loads(serialize('json', ComplaintStatusHistory.objects.all())),
            'notifications': json.loads(serialize('json', Notification.objects.all()))
        }
        with open(backup_file, 'w', encoding='utf-8') as bf:
            json.dump(backup_payload, bf, indent=2)
        self.stdout.write(self.style.SUCCESS(f'Back up created at: {backup_file}'))

        # =====================================================================
        # Step 2: Ensure Media Files Exist
        # =====================================================================
        complaint_media_dir = os.path.join(settings.MEDIA_ROOT, 'complaints')
        completion_media_dir = os.path.join(settings.MEDIA_ROOT, 'completions')
        os.makedirs(complaint_media_dir, exist_ok=True)
        os.makedirs(completion_media_dir, exist_ok=True)

        # =====================================================================
        # Step 3: Fetch Key Users
        # =====================================================================
        fatima_email = 'fathimarinsha655@gmail.com'
        fatima_user = User.objects.filter(email__iexact=fatima_email).first()
        if not fatima_user:
            fatima_user = User.objects.filter(username__iexact=fatima_email).first()
        if not fatima_user:
            self.stdout.write(self.style.WARNING(f'User {fatima_email} not found. Creating citizen account.'))
            fatima_user = User.objects.create_user(
                username=fatima_email,
                email=fatima_email,
                password='demoPassword123!',
                first_name='Fatima',
                last_name='Rinsha'
            )
            UserProfile.objects.create(user=fatima_user, role='CITIZEN')
        else:
            self.stdout.write(self.style.SUCCESS(f'Found account: {fatima_user.email} (ID: {fatima_user.id})'))

        # Demo citizen 1
        citizen1, _ = User.objects.get_or_create(
            username='citizen@example.com',
            defaults={'email': 'citizen@example.com', 'first_name': 'Citizen', 'last_name': 'One'}
        )
        if not citizen1.has_usable_password():
            citizen1.set_password('demo123')
            citizen1.save()
        UserProfile.objects.get_or_create(user=citizen1, defaults={'role': 'CITIZEN'})

        # Additional realistic citizens
        extra_citizens = [
            {'email': 'arjun.nair@civic.local', 'first': 'Arjun', 'last': 'Nair'},
            {'email': 'kavya.menon@civic.local', 'first': 'Kavya', 'last': 'Menon'},
            {'email': 'rohan.verma@civic.local', 'first': 'Rohan', 'last': 'Verma'},
        ]
        citizen_users = {
            fatima_email: fatima_user,
            'citizen@example.com': citizen1,
        }
        for ec in extra_citizens:
            u, _ = User.objects.get_or_create(
                username=ec['email'],
                defaults={'email': ec['email'], 'first_name': ec['first'], 'last_name': ec['last']}
            )
            if not u.has_usable_password():
                u.set_password('citizen123')
                u.save()
            UserProfile.objects.get_or_create(user=u, defaults={'role': 'CITIZEN'})
            citizen_users[ec['email']] = u

        # Municipal Authority
        authority_user = User.objects.filter(userprofile__role='MUNICIPAL_AUTHORITY').first()
        if not authority_user:
            authority_user = User.objects.filter(is_superuser=True).first()
        if not authority_user:
            authority_user = User.objects.create_superuser(
                username='auth@example.com',
                email='auth@example.com',
                password='adminpassword123'
            )
            UserProfile.objects.create(user=authority_user, role='MUNICIPAL_AUTHORITY')
            authority_user.first_name = "Municipal"
            authority_user.last_name = "Authority"
            authority_user.save()

        # =====================================================================
        # Step 4: Fetch Departments & Staff
        # =====================================================================
        depts = Department.objects.all()
        dept_map = {d.name: d for d in depts}

        # Check required departments
        dept_aliases = {
            'Sanitation': 'Sanitation Department',
            'Roads': 'Roads / Public Works',
            'Water': 'Water Supply Department',
            'Drainage': 'Drainage Department',
            'Electrical': 'Electrical Department',
            'Parks': 'Parks and Public Spaces Department'
        }
        for alias, canon in dept_aliases.items():
            if canon not in dept_map:
                match = Department.objects.filter(name__icontains=alias).first()
                if match:
                    dept_map[canon] = match
                else:
                    new_d = Department.objects.create(name=canon)
                    dept_map[canon] = new_d

        # Staff Map
        staff_map = {}
        for ds in DepartmentStaff.objects.select_related('user', 'department').all():
            staff_map[ds.user.email.lower()] = ds

        # =====================================================================
        # Step 5: Remove Old Demo Complaints of Fatima Rinsha & Previous Sample Data
        # =====================================================================
        self.stdout.write('Clearing existing demo complaints for Fatima Rinsha and previous sample records...')
        
        # 1. Delete all existing complaints filed by Fatima Rinsha
        fatima_complaints = Complaint.objects.filter(citizen=fatima_user)
        fatima_count = fatima_complaints.count()
        fatima_complaints.delete()
        self.stdout.write(f'Deleted {fatima_count} previous complaints for {fatima_email}.')

        # 2. Also delete old dummy complaints filed by citizen@example.com
        old_citizen_complaints = Complaint.objects.filter(citizen=citizen1)
        old_citizen_complaints.delete()

        # 3. Delete previous seeded sample complaints for extra citizens
        for ec in extra_citizens:
            extra_user = citizen_users.get(ec['email'])
            if extra_user:
                Complaint.objects.filter(citizen=extra_user).delete()

        # =====================================================================
        # Step 6: Define 24 Rich, Realistic Sample Complaints
        # =====================================================================
        # Distribution:
        # - 6 departments (4 complaints each)
        # - Statuses: 5 Pending, 9 In Progress (including 1 rejected & returned for rework), 4 Awaiting Verification, 6 Resolved
        # - Spread across the last 14 days (Oct 11 - Oct 25)
        # =====================================================================

        now = timezone.now()

        SAMPLE_DATA = [
            # -----------------------------------------------------------------
            # FATIMA RINSHA (6 Complaints across all 6 departments)
            # -----------------------------------------------------------------
            {
                'citizen': fatima_email,
                'category': 'Garbage',
                'dept': 'Sanitation Department',
                'staff': 'anjali.nair@civic.local',
                'desc': 'Overflowing municipal waste bins at the junction corner. Garbage spilling onto walkway causing severe odor and stray animal menace.',
                'loc': 'Kowdiar Main Road, Thiruvananthapuram',
                'lat': 8.524100,
                'lng': 76.957200,
                'status': 'Resolved',
                'days_ago': 7,
                'img': 'complaints/garbage_issue.jpg',
                'comp_img': 'completions/garbage_cleared.jpg',
                'comp_remarks': 'Sanitation truck team deployed. All spilled waste cleared, bins emptied, and surrounding sidewalk disinfected with lime powder.',
                'verif_remarks': 'Field verified on site. Area is clean and thoroughly sanitized. Bins restored.',
                'feedback': {'rating': 5, 'comment': 'Thank you! The garbage was cleared quickly and the area smells clean now.'}
            },
            {
                'citizen': fatima_email,
                'category': 'Pothole',
                'dept': 'Roads / Public Works',
                'staff': 'rahul.menon@civic.local',
                'desc': 'Deep pothole roughly 2 feet wide right in the middle of the bus lane. Dangerous for two-wheelers during rainy conditions.',
                'loc': 'MG Road near Central Stadium, Thiruvananthapuram',
                'lat': 8.498600,
                'lng': 76.951400,
                'status': 'In Progress',
                'days_ago': 4,
                'img': 'complaints/pothole_issue.jpg',
                'progress_remarks': 'Road inspection completed by engineer Rahul Menon. Asphalt hot-mix batch requested from depot. Patching scheduled for tonight.'
            },
            {
                'citizen': fatima_email,
                'category': 'Water Leakage',
                'dept': 'Water Supply Department',
                'staff': 'vishnu.prasad@civic.local',
                'desc': 'High-pressure water main pipeline leakage near roadside chamber. Clean drinking water continuously flowing onto street for 2 days.',
                'loc': 'Palayam Junction, Near Saphalyam Complex',
                'lat': 8.506100,
                'lng': 76.952500,
                'status': 'Awaiting Authority Verification',
                'days_ago': 5,
                'img': 'complaints/water_leak_issue.jpg',
                'comp_img': 'completions/water_leak_fixed.jpg',
                'comp_remarks': 'Excavation completed. Defective valve gasket replaced with new cast-iron fitting. Pressure tested and trench refilled cleanly.',
            },
            {
                'citizen': fatima_email,
                'category': 'Drain Blockage',
                'dept': 'Drainage Department',
                'staff': 'amal.dev@civic.local',
                'desc': 'Stormwater drain grate heavily blocked by plastic debris and silt. Water overflowing onto the sidewalk during rains.',
                'loc': 'Vellayambalam - Sasthamangalam Road',
                'lat': 8.515400,
                'lng': 76.963200,
                'status': 'In Progress', # Rejected and returned for rework
                'days_ago': 6,
                'img': 'complaints/drain_blockage_issue.jpg',
                'comp_img': 'completions/drain_cleaned.jpg',
                'comp_remarks': 'Primary grate opened and top debris scooped out.',
                'is_rejected_rework': True,
                'rejection_reason': 'Authority site inspection found grate re-seated unevenly and excavated sludge left uncollected on the footpath. Re-align grate flush with tarmac and remove all silt bags.',
            },
            {
                'citizen': fatima_email,
                'category': 'Broken Streetlight',
                'dept': 'Electrical Department',
                'staff': 'akhil.varma@civic.local',
                'desc': 'Streetlight fixture completely non-functional for past 4 nights. Road is pitch dark creating safety hazards for pedestrians.',
                'loc': 'Pettah Market Road, Thiruvananthapuram',
                'lat': 8.498100,
                'lng': 76.932800,
                'status': 'In Progress',
                'days_ago': 2,
                'img': 'complaints/streetlight_issue.jpg',
                'progress_remarks': 'Electrician inspected pole. Faulty driver unit identified. Replacement 90W LED driver requisitioned from stores.'
            },
            {
                'citizen': fatima_email,
                'category': 'Public Property Damage',
                'dept': 'Parks and Public Spaces Department',
                'staff': None, # Newly submitted pending
                'desc': 'Public park bench broken with splintered wooden slats and loose metal armrest. Unsafe for elderly park visitors and children.',
                'loc': 'Museum Public Park, Near South Gate',
                'lat': 8.509800,
                'lng': 76.955400,
                'status': 'Pending',
                'days_ago': 0, # Submitted today
                'img': 'complaints/bench_damage_issue.jpg',
            },

            # -----------------------------------------------------------------
            # CITIZEN 1 (citizen@example.com - 4 Complaints)
            # -----------------------------------------------------------------
            {
                'citizen': 'citizen@example.com',
                'category': 'Pothole',
                'dept': 'Roads / Public Works',
                'staff': 'arun.raj@civic.local',
                'desc': 'Broken road surface with exposed sharp aggregate stones outside school gate. Vehicles braking abruptly causing near-misses.',
                'loc': 'School Road, St. Marys Junction, Pattom',
                'lat': 8.514000,
                'lng': 76.945000,
                'status': 'Resolved',
                'days_ago': 10,
                'img': 'complaints/pavement_broken_issue.jpg',
                'comp_img': 'completions/pothole_repaired.jpg',
                'comp_remarks': 'Section milled down, base-course compacted, and hot bituminous asphalt laid and rolled smooth.',
                'verif_remarks': 'Inspected during daytime. Surface level and road markings repainted. Approved.',
                'feedback': {'rating': 5, 'comment': 'Smooth asphalt laid properly. Great relief for school buses and pedestrians.'}
            },
            {
                'citizen': 'citizen@example.com',
                'category': 'Garbage',
                'dept': 'Sanitation Department',
                'staff': 'anjali.nair@civic.local',
                'desc': 'Accumulation of commercial packaging boxes, plastic sacks, and organic vegetable waste behind wholesale market shops.',
                'loc': 'Chalai Bazaar West Gate, Thiruvananthapuram',
                'lat': 8.481200,
                'lng': 76.951100,
                'status': 'In Progress',
                'days_ago': 3,
                'img': 'complaints/garbage_issue.jpg',
                'progress_remarks': 'Night sanitation squad assigned with compactor truck for bulk clearance.'
            },
            {
                'citizen': 'citizen@example.com',
                'category': 'Broken Streetlight',
                'dept': 'Electrical Department',
                'staff': 'deepa.suresh@civic.local',
                'desc': 'Dual LED streetlight pole blinking uncontrollably and then going completely dark after 8 PM.',
                'loc': 'PMG Junction, Vikas Bhavan Road',
                'lat': 8.513200,
                'lng': 76.949800,
                'status': 'Resolved',
                'days_ago': 8,
                'img': 'complaints/streetlight_issue.jpg',
                'comp_img': 'completions/streetlight_repaired.jpg',
                'comp_remarks': 'Overhead junction connection repaired and new weatherproof LED luminaire installed. Illumination test successful.',
                'verif_remarks': 'Inspected at night. Lamp illuminates the pedestrian crossing clearly.',
                'feedback': {'rating': 4, 'comment': 'Fixed promptly. Road is well-lit now.'}
            },
            {
                'citizen': 'citizen@example.com',
                'category': 'Water Leakage',
                'dept': 'Water Supply Department',
                'staff': None,
                'desc': 'Slow underground water seepage creating a soggy mud patch and pooling along pedestrian pathway.',
                'loc': 'Vazhuthacaud Near Womens College',
                'lat': 8.500200,
                'lng': 76.962100,
                'status': 'Pending',
                'days_ago': 1,
                'img': 'complaints/water_leak_issue.jpg',
            },

            # -----------------------------------------------------------------
            # CITIZEN 2 (arjun.nair@civic.local - 4 Complaints)
            # -----------------------------------------------------------------
            {
                'citizen': 'arjun.nair@civic.local',
                'category': 'Drain Blockage',
                'dept': 'Drainage Department',
                'staff': 'sneha.raj@civic.local',
                'desc': 'Culvert drain blocked by tree roots and silt buildup. Stagnant foul water overflowing onto service lane.',
                'loc': 'East Fort Bus Terminal Approach Road',
                'lat': 8.483100,
                'lng': 76.948200,
                'status': 'In Progress',
                'days_ago': 4,
                'img': 'complaints/drain_blockage_issue.jpg',
                'progress_remarks': 'Drainage gang deployed with jetting machine. Jetting nozzle cleared initial 15 meters of blockage.'
            },
            {
                'citizen': 'arjun.nair@civic.local',
                'category': 'Public Property Damage',
                'dept': 'Parks and Public Spaces Department',
                'staff': 'gokul.krishna@civic.local',
                'desc': 'Cast-iron garden bench collapsed due to broken legs and rotted wooden backrest in children park.',
                'loc': 'Poojappura Public Ground and Park',
                'lat': 8.491200,
                'lng': 76.974500,
                'status': 'Resolved',
                'days_ago': 12,
                'img': 'complaints/bench_damage_issue.jpg',
                'comp_img': 'completions/park_bench_repaired.jpg',
                'comp_remarks': 'Replaced old deteriorated bench with heavy-duty teakwood slat and powder-coated cast-iron bench. Anchored to concrete foundation.',
                'verif_remarks': 'Verified solid foundation installation and quality finish. Bench is ready for public use.',
                'feedback': {'rating': 5, 'comment': 'Beautiful new bench installed! Safe for kids and senior citizens.'}
            },
            {
                'citizen': 'arjun.nair@civic.local',
                'category': 'Pothole',
                'dept': 'Roads / Public Works',
                'staff': 'nikhil.das@civic.local',
                'desc': 'Sunken manhole frame creating a 4-inch deep depression on asphalt road. Multiple vehicles hitting undercarriage.',
                'loc': 'Statue Junction, Secretariat Road',
                'lat': 8.496500,
                'lng': 76.950100,
                'status': 'Awaiting Authority Verification',
                'days_ago': 6,
                'img': 'complaints/pothole_issue.jpg',
                'comp_img': 'completions/pothole_repaired.jpg',
                'comp_remarks': 'Manhole collar raised by 3 inches to road level, reinforced concrete poured around frame, and mastic asphalt finished smooth.',
            },
            {
                'citizen': 'arjun.nair@civic.local',
                'category': 'Garbage',
                'dept': 'Sanitation Department',
                'staff': None,
                'desc': 'Household garbage bags abandoned near electric transformer. Dogs tearing bags open and spreading litter on the street.',
                'loc': 'Vanchiyoor Court Complex Road',
                'lat': 8.491500,
                'lng': 76.941900,
                'status': 'Pending',
                'days_ago': 0, # Today
                'img': 'complaints/garbage_issue.jpg',
            },

            # -----------------------------------------------------------------
            # CITIZEN 3 (kavya.menon@civic.local - 5 Complaints)
            # -----------------------------------------------------------------
            {
                'citizen': 'kavya.menon@civic.local',
                'category': 'Water Leakage',
                'dept': 'Water Supply Department',
                'staff': 'neeraj.kumar@civic.local',
                'desc': 'Substantial water pipeline burst under asphalt. Clean water bubbling up and flooding pedestrian walkway.',
                'loc': 'Medical College Road, Ulloor Junction',
                'lat': 8.521800,
                'lng': 76.927600,
                'status': 'In Progress',
                'days_ago': 3,
                'img': 'complaints/water_leak_issue.jpg',
                'progress_remarks': 'Isolation valve closed. Backhoe excavator on site to expose fractured pipe collar.'
            },
            {
                'citizen': 'kavya.menon@civic.local',
                'category': 'Broken Streetlight',
                'dept': 'Electrical Department',
                'staff': 'kiran.joseph@civic.local',
                'desc': 'Three consecutive street lights on the highway median have stopped functioning. Area very dark at night.',
                'loc': 'Kazhakkoottam Main Bypass Road',
                'lat': 8.568600,
                'lng': 76.874100,
                'status': 'Awaiting Authority Verification',
                'days_ago': 5,
                'img': 'complaints/streetlight_issue.jpg',
                'comp_img': 'completions/streetlight_repaired.jpg',
                'comp_remarks': 'Blown circuit breaker in feeder pillar replaced. New 120W LED fixtures mounted and cable termination renewed.',
            },
            {
                'citizen': 'kavya.menon@civic.local',
                'category': 'Drain Blockage',
                'dept': 'Drainage Department',
                'staff': 'rohit.nair@civic.local',
                'desc': 'Heavy silt accumulation in storm runoff culvert causing dirty water backflow during evening showers.',
                'loc': 'Kesavadasapuram Junction, NH 66',
                'lat': 8.536200,
                'lng': 76.938500,
                'status': 'Resolved',
                'days_ago': 9,
                'img': 'complaints/drain_blockage_issue.jpg',
                'comp_img': 'completions/drain_cleaned.jpg',
                'comp_remarks': 'Suction tanker and high-pressure jetting used. 2.5 tons of consolidated sludge removed and drain freely flowing.',
                'verif_remarks': 'Drainage inspected during high flow. Runoff is unimpeded. Closed and approved.',
                'feedback': {'rating': 5, 'comment': 'Waterlogging problem completely solved before heavy rains. Great job!'}
            },
            {
                'citizen': 'kavya.menon@civic.local',
                'category': 'Public Property Damage',
                'dept': 'Parks and Public Spaces Department',
                'staff': 'athira.menon@civic.local',
                'desc': 'Park boundary fence section knocked down by fallen branch. Stray animals entering landscaped lawn.',
                'loc': 'Manaveeyam Veedhi, Cultural Corridor Park',
                'lat': 8.504500,
                'lng': 76.958900,
                'status': 'In Progress',
                'days_ago': 2,
                'img': 'complaints/bench_damage_issue.jpg',
                'progress_remarks': 'Damaged panels removed by carpentry and welding team. New structural steel mesh panels being fabricated in workshop.'
            },
            {
                'citizen': 'kavya.menon@civic.local',
                'category': 'Pothole',
                'dept': 'Roads / Public Works',
                'staff': None,
                'desc': 'Cluster of potholes on curving slope. Vehicles swerving into oncoming traffic to avoid potholes.',
                'loc': 'Ambalamukku Junction, Peroorkada Road',
                'lat': 8.532100,
                'lng': 76.968900,
                'status': 'Pending',
                'days_ago': 1,
                'img': 'complaints/pothole_issue.jpg',
            },

            # -----------------------------------------------------------------
            # CITIZEN 4 (rohan.verma@civic.local - 5 Complaints)
            # -----------------------------------------------------------------
            {
                'citizen': 'rohan.verma@civic.local',
                'category': 'Garbage',
                'dept': 'Sanitation Department',
                'staff': 'suresh.kumar@civic.local',
                'desc': 'Overflowing plastic waste and food cartons scattered around the public bus shelter.',
                'loc': 'Thampanoor Railway Station Road',
                'lat': 8.489200,
                'lng': 76.952100,
                'status': 'In Progress',
                'days_ago': 3,
                'img': 'complaints/garbage_issue.jpg',
                'progress_remarks': 'Area sanitation supervisor inspected bus stop. Dedicated sweepers deployed for morning and evening shifts.'
            },
            {
                'citizen': 'rohan.verma@civic.local',
                'category': 'Drain Blockage',
                'dept': 'Drainage Department',
                'staff': 'rohit.nair@civic.local',
                'desc': 'Storm drain cover broken and clogged with silt, creating foul stagnant puddle across the crosswalk.',
                'loc': 'Jagathy Bridge Approach Road',
                'lat': 8.494700,
                'lng': 76.968200,
                'status': 'In Progress',
                'days_ago': 4,
                'img': 'complaints/drain_blockage_issue.jpg',
                'progress_remarks': 'Desilting crew assigned. Replacement precast RCC drain slab loaded for delivery.'
            },
            {
                'citizen': 'rohan.verma@civic.local',
                'category': 'Broken Streetlight',
                'dept': 'Electrical Department',
                'staff': None,
                'desc': 'Pedestrian pathway bollard light vandalized and wiring exposed. Potential electrical shock hazard in damp weather.',
                'loc': 'Karamana River Walkway, Near Bridge',
                'lat': 8.477400,
                'lng': 76.967800,
                'status': 'Pending',
                'days_ago': 0, # Today
                'img': 'complaints/streetlight_issue.jpg',
            },
            {
                'citizen': 'rohan.verma@civic.local',
                'category': 'Water Leakage',
                'dept': 'Water Supply Department',
                'staff': 'priya.mohan@civic.local',
                'desc': 'Municipal supply pipeline fitting cracked under footpath. Water spurting whenever supply valve opens.',
                'loc': 'Pattom Palace Road, Thiruvananthapuram',
                'lat': 8.528400,
                'lng': 76.942700,
                'status': 'Resolved',
                'days_ago': 11,
                'img': 'complaints/water_leak_issue.jpg',
                'comp_img': 'completions/water_leak_fixed.jpg',
                'comp_remarks': 'High-density polyethylene (HDPE) coupling installed. Pressure gauge test held at 4.2 bar without leak.',
                'verif_remarks': 'Inspected pressure test report and visual condition. Fully resolved.',
                'feedback': {'rating': 4, 'comment': 'Quick repair work. Water waste stopped immediately.'}
            },
            {
                'citizen': 'rohan.verma@civic.local',
                'category': 'Public Property Damage',
                'dept': 'Parks and Public Spaces Department',
                'staff': 'fathima.shirin@civic.local',
                'desc': 'Wooden park bench slats split and dislodged by heavy monsoon rain. Splinters sticking out.',
                'loc': 'Vellayambalam Public Square',
                'lat': 8.515400,
                'lng': 76.963200,
                'status': 'Awaiting Authority Verification',
                'days_ago': 5,
                'img': 'complaints/bench_damage_issue.jpg',
                'comp_img': 'completions/park_bench_repaired.jpg',
                'comp_remarks': 'Old decayed slats replaced with seasoned weatherproof hardwood treated with anti-fungal stain and marine varnish.',
            },
        ]

        # =====================================================================
        # Step 7: Insert Complaints with Complete Timeline & Relations
        # =====================================================================
        self.stdout.write(f'Creating {len(SAMPLE_DATA)} realistic sample complaints...')

        created_count = 0
        with transaction.atomic():
            for item in SAMPLE_DATA:
                citizen_obj = citizen_users.get(item['citizen'])
                dept_obj = dept_map.get(item['dept'])
                staff_ds = staff_map.get(item['staff'].lower()) if item.get('staff') else None

                days_ago = item['days_ago']
                created_dt = now - timedelta(days=days_ago, hours=2, minutes=15)

                c = Complaint(
                    citizen=citizen_obj,
                    category=item['category'],
                    description=item['desc'],
                    location=item['loc'],
                    latitude=item.get('lat'),
                    longitude=item.get('lng'),
                    image=item['img'],
                    status=item['status'],
                    department=dept_obj,
                    assigned_staff=staff_ds
                )
                c.save()

                # Override auto_now_add on Complaint
                Complaint.objects.filter(id=c.id).update(created_at=created_dt, updated_at=created_dt)

                # 1. Initial Submission History
                h1 = ComplaintStatusHistory.objects.create(
                    complaint=c,
                    status='Pending',
                    remarks='Complaint submitted by citizen',
                    updated_by=citizen_obj
                )
                ComplaintStatusHistory.objects.filter(id=h1.id).update(updated_at=created_dt)

                # 2. Assignment (if assigned)
                assigned_dt = created_dt + timedelta(hours=3, minutes=20)
                if staff_ds and dept_obj:
                    assign = ComplaintAssignment.objects.create(
                        complaint=c,
                        staff=staff_ds,
                        assigned_by=authority_user,
                        is_active=True
                    )
                    ComplaintAssignment.objects.filter(id=assign.id).update(assigned_at=assigned_dt)

                    if item['status'] != 'Pending':
                        h2 = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='In Progress',
                            remarks=f"Assigned to {dept_obj.name} - {staff_ds.user.get_full_name() or staff_ds.user.email}",
                            updated_by=authority_user
                        )
                        ComplaintStatusHistory.objects.filter(id=h2.id).update(updated_at=assigned_dt)

                        # Work started history
                        work_dt = assigned_dt + timedelta(hours=4)
                        h3 = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='In Progress',
                            remarks=item.get('progress_remarks', 'Field team dispatched to site; inspection and initial work commenced.'),
                            updated_by=staff_ds.user
                        )
                        ComplaintStatusHistory.objects.filter(id=h3.id).update(updated_at=work_dt)

                        Notification.objects.create(
                            user=staff_ds.user,
                            title=f"New Task Assigned: Complaint #{c.id}",
                            message=f"You have been assigned to complaint #{c.id} ({c.category}) at {c.location}.",
                            complaint=c
                        )

                # 3. Completion Submission (for Awaiting Verification, Resolved, or Rework)
                if item.get('comp_img'):
                    completion_dt = assigned_dt + timedelta(days=1, hours=4)
                    
                    if item.get('is_rejected_rework'):
                        # Case: Rejected & returned to In Progress
                        rejection_dt = completion_dt + timedelta(hours=6)
                        rejection_reason = item.get('rejection_reason', 'Work incomplete. Returned for rework.')

                        comp = ComplaintCompletion.objects.create(
                            complaint=c,
                            submitted_by=staff_ds.user if staff_ds else authority_user,
                            completion_remarks=item.get('comp_remarks', 'Initial work completed.'),
                            completion_image=item['comp_img'],
                            verification_status='Rejected',
                            verification_remarks=rejection_reason,
                            verified_by=authority_user,
                            verified_at=rejection_dt
                        )
                        ComplaintCompletion.objects.filter(id=comp.id).update(
                            submitted_at=completion_dt,
                            verified_at=rejection_dt
                        )

                        # Update complaint fields
                        Complaint.objects.filter(id=c.id).update(
                            status='In Progress',
                            rejection_reason=rejection_reason,
                            rejected_by=authority_user,
                            rejected_at=rejection_dt,
                            updated_at=rejection_dt
                        )

                        # Status History for Submission and Rejection
                        h_sub = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='Awaiting Authority Verification',
                            remarks=f"Work completed: {item.get('comp_remarks')}. Submitted for verification.",
                            updated_by=staff_ds.user
                        )
                        ComplaintStatusHistory.objects.filter(id=h_sub.id).update(updated_at=completion_dt)

                        h_rej = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='In Progress',
                            remarks=f"Verification rejected by Municipal Authority: {rejection_reason}. Returned for rework.",
                            updated_by=authority_user
                        )
                        ComplaintStatusHistory.objects.filter(id=h_rej.id).update(updated_at=rejection_dt)

                        Notification.objects.create(
                            user=staff_ds.user,
                            title=f"Rework Required: Complaint #{c.id}",
                            message=f"Municipal Authority returned complaint #{c.id} for rework. Reason: {rejection_reason}",
                            complaint=c
                        )

                    elif item['status'] == 'Awaiting Authority Verification':
                        comp = ComplaintCompletion.objects.create(
                            complaint=c,
                            submitted_by=staff_ds.user if staff_ds else authority_user,
                            completion_remarks=item.get('comp_remarks', 'Repair work completed on site.'),
                            completion_image=item['comp_img'],
                            verification_status='Pending'
                        )
                        ComplaintCompletion.objects.filter(id=comp.id).update(
                            submitted_at=completion_dt
                        )

                        h_verif = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='Awaiting Authority Verification',
                            remarks=f"Work completed: {item.get('comp_remarks')}. Submitted for verification.",
                            updated_by=staff_ds.user
                        )
                        ComplaintStatusHistory.objects.filter(id=h_verif.id).update(updated_at=completion_dt)

                    elif item['status'] == 'Resolved':
                        verif_dt = completion_dt + timedelta(hours=8)
                        verif_remarks = item.get('verif_remarks', 'Inspected and verified on site. Work completed satisfactorily.')

                        comp = ComplaintCompletion.objects.create(
                            complaint=c,
                            submitted_by=staff_ds.user if staff_ds else authority_user,
                            completion_remarks=item.get('comp_remarks', 'Repair work completed on site.'),
                            completion_image=item['comp_img'],
                            verification_status='Approved',
                            verification_remarks=verif_remarks,
                            verified_by=authority_user,
                            verified_at=verif_dt,
                            citizen_response='Confirmed',
                            citizen_remarks='Verified resolved by citizen.',
                            responded_at=verif_dt + timedelta(hours=2)
                        )
                        ComplaintCompletion.objects.filter(id=comp.id).update(
                            submitted_at=completion_dt,
                            verified_at=verif_dt,
                            responded_at=verif_dt + timedelta(hours=2)
                        )

                        Complaint.objects.filter(id=c.id).update(
                            status='Resolved',
                            verified_by=authority_user,
                            verified_at=verif_dt,
                            verification_remarks=verif_remarks,
                            updated_at=verif_dt
                        )

                        h_sub = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='Awaiting Authority Verification',
                            remarks=f"Work completed: {item.get('comp_remarks')}. Submitted for verification.",
                            updated_by=staff_ds.user
                        )
                        ComplaintStatusHistory.objects.filter(id=h_sub.id).update(updated_at=completion_dt)

                        h_res = ComplaintStatusHistory.objects.create(
                            complaint=c,
                            status='Resolved',
                            remarks=f"Verified and approved by Municipal Authority: {verif_remarks}",
                            updated_by=authority_user
                        )
                        ComplaintStatusHistory.objects.filter(id=h_res.id).update(updated_at=verif_dt)

                        # Feedback
                        if item.get('feedback'):
                            fb_dt = verif_dt + timedelta(hours=3)
                            fb = ComplaintFeedback.objects.create(
                                complaint=c,
                                citizen=citizen_obj,
                                rating=item['feedback']['rating'],
                                comment=item['feedback']['comment']
                            )
                            ComplaintFeedback.objects.filter(id=fb.id).update(created_at=fb_dt, updated_at=fb_dt)

                        # Citizen resolution notification
                        Notification.objects.create(
                            user=citizen_obj,
                            title=f"Complaint #{c.id} Resolved",
                            message=f"Your complaint regarding '{c.category}' at {c.location} has been verified and resolved.",
                            complaint=c
                        )

                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} realistic sample complaints!'))
        self.stdout.write(self.style.SUCCESS(f"Fatima Rinsha ({fatima_email}) now has {Complaint.objects.filter(citizen=fatima_user).count()} complaints."))
        self.stdout.write(self.style.SUCCESS(f"Total complaints in system: {Complaint.objects.count()}."))
