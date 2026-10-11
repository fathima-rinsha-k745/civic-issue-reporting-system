import sys
import re
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from issues.models import UserProfile, Department, DepartmentStaff

class Command(BaseCommand):
    help = 'Seed demonstration staff accounts for all existing departments'

    def handle(self, *args, **options):
        departments = Department.objects.all()
        
        if not departments.exists():
            self.stdout.write(self.style.WARNING("No departments found. Please create departments first."))
            return
            
        count = 0
        for dept in departments:
            # Create a clean slug for email and name
            clean_name = re.sub(r'[^a-zA-Z0-9]+', '', dept.name).lower()
            if not clean_name:
                clean_name = f"dept{dept.id}"
                
            email = f"staff_{clean_name}@example.com"
            username = email
            password = "staffpassword123"
            
            # Check if user already exists
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': f"{dept.name} Staff"
                }
            )
            
            if created:
                user.set_password(password)
                user.save()
                
            # Ensure UserProfile exists with right role
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'DEPARTMENT_STAFF'})
            if profile.role != 'DEPARTMENT_STAFF':
                profile.role = 'DEPARTMENT_STAFF'
                profile.save()
                
            # Assign to department
            dept_staff, ds_created = DepartmentStaff.objects.get_or_create(
                user=user,
                defaults={'department': dept}
            )
            
            if not ds_created and dept_staff.department != dept:
                dept_staff.department = dept
                dept_staff.save()
                
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created staff account for {dept.name} ({email})"))
                count += 1
            else:
                self.stdout.write(f"Staff account for {dept.name} ({email}) already exists.")

        self.stdout.write(self.style.SUCCESS(f"Successfully created/verified {count} staff accounts."))
