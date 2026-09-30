from django.test import Client
from django.contrib.auth.models import User
from issues.models import UserProfile
import json

client = Client()

print("--- Setting up test users ---")
roles = ['CITIZEN', 'MUNICIPAL_AUTHORITY', 'DEPARTMENT_STAFF']
for role in roles:
    email = f"{role.lower()}@test.com"
    password = "password123"
    user, created = User.objects.get_or_create(username=email, email=email)
    if created:
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, role=role)

print("\n--- Test 1: Empty Fields ---")
res = client.post('/api/login/', json.dumps({}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 2: Invalid User ---")
res = client.post('/api/login/', json.dumps({
    "email": "wrong@test.com", "password": "password123"
}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 3: Wrong Password ---")
res = client.post('/api/login/', json.dumps({
    "email": "citizen@test.com", "password": "wrongpassword"
}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 4: Citizen Login ---")
res = client.post('/api/login/', json.dumps({
    "email": "citizen@test.com", "password": "password123"
}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 5: Authority Login ---")
res = client.post('/api/login/', json.dumps({
    "email": "municipal_authority@test.com", "password": "password123"
}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 6: Staff Login ---")
res = client.post('/api/login/', json.dumps({
    "email": "department_staff@test.com", "password": "password123"
}), content_type='application/json')
print(res.status_code, res.json())
