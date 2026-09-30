import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from issues.models import UserProfile

email = 'admin@example.com'
password = 'password123'

if User.objects.filter(email=email).exists():
    user = User.objects.get(email=email)
    user.set_password(password)
    user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'MUNICIPAL_AUTHORITY'})
    profile.role = 'MUNICIPAL_AUTHORITY'
    profile.save()
    print("User updated successfully!")
else:
    user = User.objects.create_user(username=email, email=email, password=password)
    UserProfile.objects.create(user=user, role='MUNICIPAL_AUTHORITY')
    print("User created successfully!")
