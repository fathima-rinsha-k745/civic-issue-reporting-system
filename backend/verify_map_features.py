import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from decimal import Decimal
from issues.models import Complaint, Department, DepartmentStaff, UserProfile

def run_verification():
    print("==================================================================")
    print("CIVICCONNECT FREE MAP LOCATION PICKER - COMPREHENSIVE VERIFICATION")
    print("==================================================================")

    client = Client()

    # 1. Retrieve or setup test users
    print("\n--- 1. Testing Citizen Login and Complaint Submission with Coordinates ---")
    citizen = User.objects.filter(email='citizen@example.com').first()
    if not citizen:
        citizen = User.objects.create_user('citizen@example.com', 'citizen@example.com', 'pass123', first_name='Citizen', last_name='Tester')
        UserProfile.objects.create(user=citizen, role='CITIZEN')
    else:
        citizen.set_password('pass123')
        citizen.save()

    login_res = client.post('/api/login/', json.dumps({
        'email': 'citizen@example.com',
        'password': 'pass123',
        'expected_role': 'CITIZEN'
    }), content_type='application/json')
    assert login_res.status_code == 200, f"Citizen login failed: {login_res.status_code} {login_res.json()}"
    print("[PASS] Citizen login successful.")

    # Submit complaint with coordinates in Kochi, Kerala
    test_lat = 9.931234
    test_lon = 76.267301
    submit_res = client.post('/api/complaints/', {
        'description': 'Pothole on MG Road near Metro Pillar 42',
        'location': 'MG Road, Kochi, Kerala',
        'category': 'Pothole',
        'latitude': test_lat,
        'longitude': test_lon
    })
    assert submit_res.status_code == 201, f"Submission failed: {submit_res.status_code} {submit_res.json()}"
    new_complaint_id = submit_res.json().get('id')
    saved_lat = submit_res.json().get('latitude')
    saved_lon = submit_res.json().get('longitude')
    print(f"[PASS] Complaint #{new_complaint_id} submitted with coordinates: Lat {saved_lat}, Lon {saved_lon}")
    assert Decimal(str(saved_lat)) == Decimal(str(test_lat)), "Latitude mismatch!"
    assert Decimal(str(saved_lon)) == Decimal(str(test_lon)), "Longitude mismatch!"

    # 2. Check Database Storage
    print("\n--- 2. Verifying PostgreSQL Database Storage ---")
    db_obj = Complaint.objects.get(id=new_complaint_id)
    assert db_obj.latitude == Decimal(str(test_lat)), "DB latitude does not match!"
    assert db_obj.longitude == Decimal(str(test_lon)), "DB longitude does not match!"
    assert db_obj.location == 'MG Road, Kochi, Kerala', "DB location does not match!"
    assert db_obj.citizen == citizen, "Citizen account mismatch!"
    print(f"[PASS] Verified directly in PostgreSQL: Complaint #{db_obj.id} has latitude={db_obj.latitude}, longitude={db_obj.longitude}")

    # 3. Test OpenStreetMap URL Construction
    print("\n--- 3. Verifying OpenStreetMap URL Format ---")
    osm_url = f"https://www.openstreetmap.org/?mlat={db_obj.latitude}&mlon={db_obj.longitude}#map=18/{db_obj.latitude}/{db_obj.longitude}"
    expected_format = f"https://www.openstreetmap.org/?mlat=9.931234&mlon=76.267301#map=18/9.931234/76.267301"
    assert osm_url == expected_format, f"OSM URL mismatch: {osm_url}"
    print(f"[PASS] OpenStreetMap URL generated accurately: {osm_url}")

    # 4. Verify Detail Screen API for Citizen
    print("\n--- 4. Verifying Citizen Access to Complaint Details ---")
    detail_res = client.get(f'/api/complaints/{new_complaint_id}/')
    assert detail_res.status_code == 200, f"Detail fetch failed: {detail_res.status_code}"
    assert detail_res.json().get('latitude') == '9.931234'
    assert detail_res.json().get('longitude') == '76.267301'
    print("[PASS] Citizen can view complaint details with latitude and longitude.")

    # 5. Verify Municipal Authority Access
    print("\n--- 5. Verifying Municipal Authority Access to Location Coordinates ---")
    client.post('/api/logout/')
    auth_user = User.objects.filter(email='auth@example.com').first()
    if not auth_user:
        auth_user = User.objects.create_user('auth@example.com', 'auth@example.com', 'pass123', first_name='Authority')
        UserProfile.objects.create(user=auth_user, role='MUNICIPAL_AUTHORITY')
    else:
        auth_user.set_password('pass123')
        auth_user.save()

    auth_login = client.post('/api/login/', json.dumps({
        'email': 'auth@example.com',
        'password': 'pass123',
        'expected_role': 'MUNICIPAL_AUTHORITY'
    }), content_type='application/json')
    assert auth_login.status_code == 200, "Authority login failed"

    auth_detail = client.get(f'/api/complaints/{new_complaint_id}/')
    assert auth_detail.status_code == 200, "Authority detail fetch failed"
    assert auth_detail.json().get('latitude') == '9.931234'
    assert auth_detail.json().get('longitude') == '76.267301'
    print(f"[PASS] Municipal Authority can view complaint coordinates: Lat {auth_detail.json().get('latitude')}, Lon {auth_detail.json().get('longitude')}")

    # Assign to Public Works Department
    pwd_dept = Department.objects.first()
    if not pwd_dept:
        pwd_dept = Department.objects.create(name='Roads & Works')
    assign_res = client.patch(f'/api/complaints/{new_complaint_id}/', json.dumps({
        'department': pwd_dept.id,
        'status': 'In Progress',
        'remarks': 'Assigned to team'
    }), content_type='application/json')
    assert assign_res.status_code == 200, "Authority assignment failed"
    print(f"[PASS] Authority assigned complaint to department: {pwd_dept.name}")

    # 6. Verify Department Staff Access and Location Protection
    print("\n--- 6. Verifying Department Staff View and Location Immutability ---")
    client.post('/api/logout/')
    staff_user = User.objects.filter(email='staff_roads@example.com').first()
    if not staff_user:
        staff_user = User.objects.create_user('staff_roads@example.com', 'staff_roads@example.com', 'pass123')
        UserProfile.objects.create(user=staff_user, role='DEPARTMENT_STAFF')
        DepartmentStaff.objects.create(user=staff_user, department=pwd_dept)
    else:
        staff_user.set_password('pass123')
        staff_user.save()
        staff_ds, _ = DepartmentStaff.objects.get_or_create(user=staff_user, defaults={'department': pwd_dept})
        staff_ds.department = pwd_dept
        staff_ds.save()

    staff_login = client.post('/api/login/', json.dumps({
        'email': 'staff_roads@example.com',
        'password': 'pass123',
        'expected_role': 'DEPARTMENT_STAFF'
    }), content_type='application/json')
    assert staff_login.status_code == 200, "Staff login failed"

    staff_detail = client.get(f'/api/complaints/{new_complaint_id}/')
    assert staff_detail.status_code == 200, "Staff detail fetch failed"
    assert staff_detail.json().get('latitude') == '9.931234'
    assert staff_detail.json().get('longitude') == '76.267301'
    print(f"[PASS] Department Staff can view coordinates: Lat {staff_detail.json().get('latitude')}, Lon {staff_detail.json().get('longitude')}")

    # Attempt to tamper with location as Department Staff
    tamper_res = client.patch(f'/api/complaints/{new_complaint_id}/', json.dumps({
        'status': 'Resolved',
        'remarks': 'Repairs finished',
        'latitude': 15.000000,
        'longitude': 78.000000,
        'location': 'Tampered address'
    }), content_type='application/json')
    assert tamper_res.status_code == 200, "Staff update status failed"

    db_obj.refresh_from_db()
    assert db_obj.status == 'Resolved', "Status should be updated"
    assert db_obj.latitude == Decimal('9.931234'), "Latitude was tampered!"
    assert db_obj.longitude == Decimal('76.267301'), "Longitude was tampered!"
    assert db_obj.location == 'MG Road, Kochi, Kerala', "Location text was tampered!"
    print("[PASS] Security verified: Department Staff cannot alter complaint location coordinates.")

    # 7. Backward Compatibility: Older Complaints Without Coordinates
    print("\n--- 7. Verifying Backward Compatibility with Existing Coordinate-less Complaints ---")
    old_complaint = Complaint.objects.filter(latitude__isnull=True).first()
    if old_complaint:
        old_res = client.get(f'/api/complaints/{old_complaint.id}/')
        assert old_res.status_code == 200
        assert old_res.json().get('latitude') is None
        assert old_res.json().get('longitude') is None
        print(f"[PASS] Older Complaint #{old_complaint.id} loads gracefully with latitude=null, longitude=null.")
    else:
        print("[INFO] No coordinate-less complaint found; creating one to verify.")
        c_no_geo = Complaint.objects.create(
            citizen=citizen,
            category='Garbage',
            description='Legacy complaint without coordinates',
            location='Old Town Square'
        )
        assert c_no_geo.latitude is None
        assert c_no_geo.longitude is None
        print(f"[PASS] Complaint #{c_no_geo.id} created without coordinates is completely valid.")

    # 8. Coordinate Boundary and Validation Tests
    print("\n--- 8. Verifying Backend Coordinate Validation Rules ---")
    client.post('/api/logout/')
    client.post('/api/login/', json.dumps({
        'email': 'citizen@example.com',
        'password': 'pass123'
    }), content_type='application/json')

    # Out-of-bounds Lat > 90
    bad_lat = client.post('/api/complaints/', {
        'description': 'Bad lat test',
        'location': 'Test',
        'category': 'Other',
        'latitude': 95.0,
        'longitude': 76.0
    })
    assert bad_lat.status_code == 400, f"Expected 400 for lat > 90, got {bad_lat.status_code}"
    print("[PASS] Backend rejected latitude > 90 (400 Bad Request)")

    # Out-of-bounds Lat < -90
    bad_neg_lat = client.post('/api/complaints/', {
        'description': 'Bad lat test',
        'location': 'Test',
        'category': 'Other',
        'latitude': -95.0,
        'longitude': 76.0
    })
    assert bad_neg_lat.status_code == 400, f"Expected 400 for lat < -90, got {bad_neg_lat.status_code}"
    print("[PASS] Backend rejected latitude < -90 (400 Bad Request)")

    # Out-of-bounds Lon > 180
    bad_lon = client.post('/api/complaints/', {
        'description': 'Bad lon test',
        'location': 'Test',
        'category': 'Other',
        'latitude': 10.0,
        'longitude': 185.0
    })
    assert bad_lon.status_code == 400, f"Expected 400 for lon > 180, got {bad_lon.status_code}"
    print("[PASS] Backend rejected longitude > 180 (400 Bad Request)")

    # Out-of-bounds Lon < -180
    bad_neg_lon = client.post('/api/complaints/', {
        'description': 'Bad lon test',
        'location': 'Test',
        'category': 'Other',
        'latitude': 10.0,
        'longitude': -190.0
    })
    assert bad_neg_lon.status_code == 400, f"Expected 400 for lon < -180, got {bad_neg_lon.status_code}"
    print("[PASS] Backend rejected longitude < -180 (400 Bad Request)")

    # Non-numeric coordinate string
    bad_str = client.post('/api/complaints/', {
        'description': 'Non numeric test',
        'location': 'Test',
        'category': 'Other',
        'latitude': 'invalid_string',
        'longitude': 76.0
    })
    assert bad_str.status_code == 400, f"Expected 400 for invalid numeric string, got {bad_str.status_code}"
    print("[PASS] Backend rejected non-numeric coordinate string (400 Bad Request)")

    print("\n==================================================================")
    print("ALL 8 VERIFICATION PHASES PASSED WITH ZERO ERRORS!")
    print("==================================================================")

if __name__ == '__main__':
    run_verification()
