import requests

session = requests.Session()

# 1. Login
login_url = "http://127.0.0.1:8000/api/login/"
login_data = {
    "email": "citizen@example.com",
    "password": "password123",
    "expected_role": "CITIZEN"
}

response = session.post(login_url, json=login_data)
print("Login Status:", response.status_code)
print("Login Response:", response.json())

if response.status_code == 200:
    # 2. Get Profile
    profile_url = "http://127.0.0.1:8000/api/profile/"
    response = session.get(profile_url)
    print("Get Profile Status:", response.status_code)
    print("Get Profile Response:", response.json())
    
    # 3. Update Profile
    update_data = {
        "full_name": "Updated Citizen Name",
        "email": "citizen@example.com"
    }
    response = session.patch(profile_url, json=update_data)
    print("Update Profile Status:", response.status_code)
    print("Update Profile Response:", response.json())
