import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from issues.models import UserProfile, Department, Complaint

client = Client()

print("--- Clean up ---")
User.objects.all().delete()
Department.objects.all().delete()
Complaint.objects.all().delete()

print("--- Create Departments ---")
d1 = Department.objects.create(name="Sanitation")
d2 = Department.objects.create(name="Roads")
print(f"Departments: {d1.id}, {d2.id}")

print("--- Register Citizen ---")
res = client.post('/api/register/', json.dumps({
    "email": "citizen@example.com",
    "password": "pass",
    "full_name": "Citizen One"
}), content_type='application/json')
print(res.status_code, res.json())

print("--- Register Authority ---")
# Register normally, then change role
res = client.post('/api/register/', json.dumps({
    "email": "auth@example.com",
    "password": "pass",
    "full_name": "Authority One"
}), content_type='application/json')
u = User.objects.get(email="auth@example.com")
p = u.userprofile
p.role = "MUNICIPAL_AUTHORITY"
p.save()

print("--- Login Citizen ---")
res = client.post('/api/login/', json.dumps({
    "email": "citizen@example.com",
    "password": "pass"
}), content_type='application/json')
print("Login Citizen:", res.status_code, res.json())

print("--- Submit Complaint (Citizen) ---")
res = client.post('/api/complaints/', json.dumps({
    "description": "Garbage overflow",
    "location": "Main St",
    "category": "Garbage"
}), content_type='application/json')
print("Submit:", res.status_code, res.json())
complaint_id = res.json().get('id')

print("--- Logout Citizen ---")
client.post('/api/logout/')

print("--- Login Authority ---")
res = client.post('/api/login/', json.dumps({
    "email": "auth@example.com",
    "password": "pass"
}), content_type='application/json')
print("Login Auth:", res.status_code, res.json())

print("--- List Complaints (Authority) ---")
res = client.get('/api/complaints/')
print("List Complaints:", res.status_code, res.json())

print("--- Assign Department (Authority) ---")
res = client.patch(f'/api/complaints/{complaint_id}/', json.dumps({
    "department": d1.id,
    "status": "In Progress",
    "remarks": "Assigned to Sanitation"
}), content_type='application/json')
print("Update:", res.status_code, res.json())

print("--- Check History ---")
res = client.get(f'/api/complaints/{complaint_id}/')
print("Check History:", res.status_code)
# print(res.json().get('status_history', 'No history in response?'))
# We didn't serialize history in ComplaintSerializer! Let's check models.
for h in Complaint.objects.get(id=complaint_id).status_history.all():
    print(h.status, h.remarks)
