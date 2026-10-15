import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from issues.models import UserProfile, Department

def recreate_data():
    email = "fathimarinsha655@gmail.com"
    password = "123456789"
    if not User.objects.filter(email__iexact=email).exists():
        u = User.objects.create_user(username=email, email=email, password=password)
        UserProfile.objects.create(user=u, role='CITIZEN')
        print(f"Recreated user {email}")

    # Recreate departments
    departments = [
        "Sanitation Department",
        "Roads / Public Works",
        "Water Supply Department",
        "Electrical Department",
        "Drainage Department",
        "Parks and Public Spaces Department"
    ]
    for d in departments:
        Department.objects.get_or_create(name=d)
    print("Recreated departments")

if __name__ == '__main__':
    recreate_data()
