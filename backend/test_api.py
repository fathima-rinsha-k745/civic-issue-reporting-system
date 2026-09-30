from django.test import Client
import json

client = Client()

print("--- Test 1: Missing Fields ---")
res = client.post('/api/register/', json.dumps({}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 2: Valid Registration ---")
res = client.post('/api/register/', json.dumps({
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 3: Duplicate Registration ---")
res = client.post('/api/register/', json.dumps({
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
}), content_type='application/json')
print(res.status_code, res.json())

print("\n--- Test 4: Invalid Email Format ---")
res = client.post('/api/register/', json.dumps({
    "email": "invalidemail",
    "password": "testpassword123",
    "full_name": "Test User"
}), content_type='application/json')
print(res.status_code, res.json())

from django.contrib.auth.models import User
from issues.models import UserProfile
u = User.objects.get(email="test@example.com")
p = UserProfile.objects.get(user=u)
print(f"\nCreated User: {u.username}, Email: {u.email}, Role: {p.role}")
