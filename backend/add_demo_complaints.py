import os
import shutil
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from issues.models import Complaint, Department, ComplaintStatusHistory
from django.core.files import File
from datetime import datetime, timedelta

def main():
    # 1. Find user
    email = "FathimaRinsha655@gmail.com"
    try:
        user = User.objects.get(email__iexact=email)
        print(f"Found user: {user.username}")
    except User.DoesNotExist:
        print(f"Error: User with email {email} not found.")
        return

    # To avoid duplicates, check if demo complaints already exist for this user
    if Complaint.objects.filter(citizen=user, description__icontains="[Demo]").exists():
        print("Demo complaints already exist for this user. Skipping creation.")
        return

    # 2. Setup images
    artifact_dir = r"C:\Users\DELL\.gemini\antigravity-ide\brain\2a8ff3a0-829a-4754-b16c-258da6b371f0"
    media_complaints_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'complaints')
    os.makedirs(media_complaints_dir, exist_ok=True)

    images = {
        "garbage": "garbage_overflow_1791646486020.jpg",
        "pothole": "pothole_main_road_1791646500118.jpg",
        "water": "water_leakage_1791646514843.jpg",
        "streetlight": "broken_streetlight_1791646546008.jpg",
        "drainage": "blocked_drainage_1791646562215.jpg",
        "bench": "damaged_park_bench_1791646577422.jpg",
        "pavement": "broken_road_pavement_1791646603662.jpg"
    }

    # Copy images to media dir
    copied_images = {}
    for key, filename in images.items():
        src = os.path.join(artifact_dir, filename)
        dst = os.path.join(media_complaints_dir, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            copied_images[key] = f"complaints/{filename}"
            print(f"Copied {filename}")
        else:
            print(f"Warning: {filename} not found in artifact dir.")
            copied_images[key] = None

    def get_dept(name):
        return Department.objects.filter(name__icontains=name).first()

    complaints_data = [
        {
            "category": "Garbage",
            "department": get_dept("Sanitation"),
            "status": "Pending",
            "description": "[Demo] Title: Garbage overflowing near a residential area\n\nThere is a massive overflow of garbage at the main bin located near the residential society. The smell is unbearable and it's attracting stray animals.",
            "location": "Greenwood Residential Area, Block B",
            "image_key": "garbage",
            "history": []
        },
        {
            "category": "Pothole",
            "department": get_dept("Public Works"),
            "status": "In Progress",
            "description": "[Demo] Title: Large pothole on a main road\n\nA large, deep pothole has formed in the middle of the main road. It is causing severe traffic slowdowns and is highly dangerous for two-wheelers.",
            "location": "Main Avenue Road, near City Center",
            "image_key": "pothole",
            "history": [("Pending", "Complaint received and verified."), ("In Progress", "Staff has been assigned and repair materials are being transported.")]
        },
        {
            "category": "Water Leakage",
            "department": get_dept("Water Supply"),
            "status": "Pending",
            "description": "[Demo] Title: Water leakage from a public pipeline\n\nThere is a continuous spray of water leaking from a broken public pipeline onto the street, wasting hundreds of liters of water.",
            "location": "Northside Street, near the old library",
            "image_key": "water",
            "history": []
        },
        {
            "category": "Broken Streetlight",
            "department": get_dept("Electrical"),
            "status": "Resolved",
            "description": "[Demo] Title: Streetlight not working near a residential street\n\nThe streetlight pole has been damaged and the light is not functioning. The street is completely dark at night, raising safety concerns.",
            "location": "Elm Street, opposite house #42",
            "image_key": "streetlight",
            "history": [("Pending", "Complaint logged."), ("In Progress", "Technician dispatched to the location."), ("Resolved", "The broken post has been removed and a new temporary light installed.")]
        },
        {
            "category": "Drain Blockage",
            "department": get_dept("Drainage"),
            "status": "In Progress",
            "description": "[Demo] Title: Blocked drainage causing water accumulation\n\nThe street drainage is completely blocked with debris and plastics. Dirty water is accumulating around it and might overflow soon.",
            "location": "West End Avenue, Corner 5",
            "image_key": "drainage",
            "history": [("Pending", "Complaint noted."), ("In Progress", "Cleaning team is currently at the location clearing the blockage.")]
        },
        {
            "category": "Public Property Damage",
            "department": get_dept("Parks"),
            "status": "Pending",
            "description": "[Demo] Title: Damaged public park bench\n\nA wooden bench in the public park has been severely damaged and broken, making it unusable for visitors.",
            "location": "Central City Park, near the fountain",
            "image_key": "bench",
            "history": []
        },
        {
            "category": "Pothole",
            "department": get_dept("Public Works"),
            "status": "Pending",
            "description": "[Demo] Title: Broken road pavement near a school\n\nThe road pavement is broken and the asphalt is severely cracked right in front of the elementary school, posing a risk to children and school buses.",
            "location": "Oakwood Elementary School Front Gate",
            "image_key": "pavement",
            "history": []
        }
    ]

    for data in complaints_data:
        complaint = Complaint.objects.create(
            citizen=user,
            category=data["category"],
            description=data["description"],
            location=data["location"],
            status=data["status"],
            department=data["department"]
        )
        if copied_images[data["image_key"]]:
            complaint.image.name = copied_images[data["image_key"]]
            complaint.save()
        
        # Add history
        # Always add initial pending history if no history is provided, or if provided, just use that.
        if not data["history"]:
            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                status="Pending",
                remarks="Complaint automatically submitted to the system."
            )
        else:
            for status, remark in data["history"]:
                ComplaintStatusHistory.objects.create(
                    complaint=complaint,
                    status=status,
                    remarks=remark
                )
        print(f"Created complaint: {data['category']} - {data['status']}")

    print("Successfully created 7 demo complaints.")

if __name__ == '__main__':
    main()
