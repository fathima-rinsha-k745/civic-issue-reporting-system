import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

u = User.objects.filter(email='admin@example.com').first()
print('--- DATABASE CHECK ---')
if u:
    print('User Exists: True')
    print(f'Email: {u.email}')
    print(f'Role: {u.userprofile.role if hasattr(u, "userprofile") else "No Profile"}')
else:
    print('User Exists: False')
