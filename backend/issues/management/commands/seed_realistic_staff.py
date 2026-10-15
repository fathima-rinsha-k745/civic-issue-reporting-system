import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db.models import Q
from issues.models import Department, DepartmentStaff, UserProfile, Complaint

class Command(BaseCommand):
    help = 'Seeds realistic department staff members across all departments in CivicConnect'

    def handle(self, *args, **options):
        self.stdout.write("Configuring realistic department staff accounts...")

        STAFF_DATA = [
            {
                'canonical_name': 'Sanitation Department',
                'dept_queries': ['Sanitation Department', 'Sanitation'],
                'staff': [
                    {'name': 'Anjali Nair', 'email': 'anjali.nair@civic.local'},
                    {'name': 'Suresh Kumar', 'email': 'suresh.kumar@civic.local'},
                    {'name': 'Meera Krishnan', 'email': 'meera.krishnan@civic.local'},
                ]
            },
            {
                'canonical_name': 'Roads / Public Works',
                'dept_queries': ['Roads / Public Works', 'Public Works Department', 'Roads & Works', 'Public Works', 'Roads'],
                'staff': [
                    {'name': 'Rahul Menon', 'email': 'rahul.menon@civic.local'},
                    {'name': 'Arun Raj', 'email': 'arun.raj@civic.local'},
                    {'name': 'Nikhil Das', 'email': 'nikhil.das@civic.local'},
                ]
            },
            {
                'canonical_name': 'Water Supply Department',
                'dept_queries': ['Water Supply Department', 'Water Supply'],
                'staff': [
                    {'name': 'Neeraj Kumar', 'email': 'neeraj.kumar@civic.local'},
                    {'name': 'Priya Mohan', 'email': 'priya.mohan@civic.local'},
                    {'name': 'Vishnu Prasad', 'email': 'vishnu.prasad@civic.local'},
                ]
            },
            {
                'canonical_name': 'Electrical Department',
                'dept_queries': ['Electrical Department', 'Electrical'],
                'staff': [
                    {'name': 'Akhil Varma', 'email': 'akhil.varma@civic.local'},
                    {'name': 'Deepa Suresh', 'email': 'deepa.suresh@civic.local'},
                    {'name': 'Kiran Joseph', 'email': 'kiran.joseph@civic.local'},
                ]
            },
            {
                'canonical_name': 'Drainage Department',
                'dept_queries': ['Drainage Department', 'Drainage'],
                'staff': [
                    {'name': 'Amal Dev', 'email': 'amal.dev@civic.local'},
                    {'name': 'Sneha Raj', 'email': 'sneha.raj@civic.local'},
                    {'name': 'Rohit Nair', 'email': 'rohit.nair@civic.local'},
                ]
            },
            {
                'canonical_name': 'Parks and Public Spaces Department',
                'dept_queries': ['Parks and Public Spaces Department', 'Parks and Public Spaces', 'Parks & Rec', 'Parks'],
                'staff': [
                    {'name': 'Athira Menon', 'email': 'athira.menon@civic.local'},
                    {'name': 'Gokul Krishna', 'email': 'gokul.krishna@civic.local'},
                    {'name': 'Fathima Shirin', 'email': 'fathima.shirin@civic.local'},
                ]
            },
        ]

        default_password = "staffpassword123"
        total_created = 0
        total_verified = 0

        for group in STAFF_DATA:
            canonical_name = group['canonical_name']
            canonical_dept = None
            
            # 1. Look for existing department by canonical name
            canonical_dept = Department.objects.filter(name__iexact=canonical_name).first()

            # 2. If not found, look for an existing record matching alias queries and reuse/rename it
            if not canonical_dept:
                for query in group['dept_queries']:
                    dept_match = Department.objects.filter(name__iexact=query).first()
                    if dept_match:
                        canonical_dept = dept_match
                        canonical_dept.name = canonical_name
                        canonical_dept.save()
                        break
            
            # 3. If still not found, try icontains
            if not canonical_dept:
                for query in group['dept_queries']:
                    dept_match = Department.objects.filter(name__icontains=query).first()
                    if dept_match:
                        canonical_dept = dept_match
                        canonical_dept.name = canonical_name
                        canonical_dept.save()
                        break

            # 4. If none found, create it
            if not canonical_dept:
                canonical_dept = Department.objects.create(name=canonical_name)
                self.stdout.write(self.style.WARNING(f"Created missing department: {canonical_name}"))

            self.stdout.write(f"\nProcessing Department: {canonical_dept.name} (ID: {canonical_dept.id})")

            # 5. Clean up any duplicate/alias departments:
            # Reassign any complaints and staff from duplicate alias departments to canonical_dept, then delete alias departments
            for query in group['dept_queries']:
                alias_depts = Department.objects.filter(name__iexact=query).exclude(id=canonical_dept.id)
                for alias_dept in alias_depts:
                    reassigned_c = Complaint.objects.filter(department=alias_dept).update(department=canonical_dept)
                    reassigned_s = DepartmentStaff.objects.filter(department=alias_dept).update(department=canonical_dept)
                    self.stdout.write(f"  -> Merged duplicate alias department '{alias_dept.name}' (ID {alias_dept.id}) into '{canonical_dept.name}': {reassigned_c} complaints, {reassigned_s} staff.")
                    alias_dept.delete()

            for staff_member in group['staff']:
                name = staff_member['name']
                email = staff_member['email']
                name_parts = name.split(' ', 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ''

                user = User.objects.filter(email__iexact=email).first()
                if not user:
                    user = User.objects.filter(username__iexact=email).first()

                created = False
                if not user:
                    user = User.objects.create_user(
                        username=email,
                        email=email,
                        password=default_password,
                        first_name=first_name,
                        last_name=last_name
                    )
                    created = True
                    total_created += 1
                else:
                    user.first_name = first_name
                    user.last_name = last_name
                    user.set_password(default_password)
                    user.is_active = True
                    user.save()
                    total_verified += 1

                # Ensure UserProfile exists with DEPARTMENT_STAFF role
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': 'DEPARTMENT_STAFF'}
                )
                if profile.role != 'DEPARTMENT_STAFF':
                    profile.role = 'DEPARTMENT_STAFF'
                    profile.save()

                # Ensure DepartmentStaff exists with the canonical department
                dept_staff, _ = DepartmentStaff.objects.get_or_create(
                    user=user,
                    defaults={'department': canonical_dept}
                )
                if dept_staff.department != canonical_dept:
                    dept_staff.department = canonical_dept
                    dept_staff.save()

                status_str = "Created" if created else "Verified"
                self.stdout.write(self.style.SUCCESS(f"  [{status_str}] {name} ({email}) -> {canonical_dept.name}"))

        # Update generic demonstration display names without deleting references
        generic_staff_users = User.objects.filter(
            userprofile__role='DEPARTMENT_STAFF'
        ).filter(
            Q(email__startswith='staff_') |
            Q(first_name__icontains='Department Staff') |
            Q(first_name__endswith='Staff')
        ).exclude(email__endswith='@civic.local')

        for gu in generic_staff_users:
            if 'Department Staff' in gu.first_name and not gu.first_name.endswith('(Legacy)'):
                gu.first_name = f"{gu.first_name} (Legacy)"
                gu.save()

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {total_created} new staff accounts, verified {total_verified} accounts. "
            f"All accounts configured with development password: {default_password}"
        ))
