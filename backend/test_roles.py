import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()

print("--- Role Validation Tests ---")
# 1. Authority login via Authority endpoint (valid)
res = client.post('/api/login/', json.dumps({
    "email": "admin@example.com",
    "password": "password123",
    "expected_role": "MUNICIPAL_AUTHORITY"
}), content_type='application/json')
print(f"Authority on Authority page: {res.status_code}")

# 2. Authority login via Citizen endpoint (invalid)
res = client.post('/api/login/', json.dumps({
    "email": "admin@example.com",
    "password": "password123",
    "expected_role": "CITIZEN"
}), content_type='application/json')
print(f"Authority on Citizen page: {res.status_code} - {res.json()}")

# 3. Citizen login via Citizen endpoint (valid)
res = client.post('/api/login/', json.dumps({
    "email": "citizen@example.com",
    "password": "pass",
    "expected_role": "CITIZEN"
}), content_type='application/json')
print(f"Citizen on Citizen page: {res.status_code}")

# 4. Citizen login via Staff endpoint (invalid)
res = client.post('/api/login/', json.dumps({
    "email": "citizen@example.com",
    "password": "pass",
    "expected_role": "DEPARTMENT_STAFF"
}), content_type='application/json')
print(f"Citizen on Staff page: {res.status_code} - {res.json()}")
