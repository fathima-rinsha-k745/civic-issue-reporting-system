import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from issues.models import Department, Complaint

client = Client()

print("--- Login Authority ---")
res = client.post('/api/login/', json.dumps({
    "email": "auth@example.com",
    "password": "pass"
}), content_type='application/json')
print("Login Auth:", res.status_code)

print("--- Create Department ---")
res = client.post('/api/departments/', json.dumps({
    "name": "Parks and Recreation"
}), content_type='application/json')
print("Create Dept:", res.status_code, res.json())
dept_id = res.json().get('id')

print("--- List Departments ---")
res = client.get('/api/departments/')
print("List Depts:", res.status_code, len(res.json()))

print("--- Update Department ---")
res = client.patch(f'/api/departments/{dept_id}/', json.dumps({
    "name": "Parks & Rec"
}), content_type='application/json')
print("Update Dept:", res.status_code, res.json())

print("--- Create Staff ---")
res = client.post('/api/staff/', json.dumps({
    "email": "staff_parks@example.com",
    "password": "pass",
    "full_name": "Parks Staff",
    "department_id": dept_id
}), content_type='application/json')
print("Create Staff:", res.status_code, res.json())
staff_id = res.json().get('id')

print("--- List Staff ---")
res = client.get('/api/staff/')
print("List Staff:", res.status_code, len(res.json()))

print("--- Update Staff ---")
res = client.patch(f'/api/staff/{staff_id}/', json.dumps({
    "is_active": False
}), content_type='application/json')
print("Update Staff:", res.status_code, res.json())
