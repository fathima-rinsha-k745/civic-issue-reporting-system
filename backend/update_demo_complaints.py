import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from issues.models import Complaint

def update_complaints():
    try:
        user = User.objects.get(email__iexact="fathimarinsha655@gmail.com")
    except User.DoesNotExist:
        print("User not found.")
        return

    complaints = Complaint.objects.filter(citizen=user)
    
    kerala_locations = {
        "Garbage": "MG Road, Ernakulam",
        "Pothole": "Palayam, Thiruvananthapuram",
        "Water Leakage": "Kozhikode Beach Road",
        "Broken Streetlight": "Pattom, Thiruvananthapuram",
        "Drain Blockage": "Marine Drive, Kochi",
        "Public Property Damage": "Swaraj Round, Thrissur",
    }
    
    # Just generic Kerala locations if category repeats or not mapped
    fallback_locations = [
        "Edappally, Kochi",
        "Kowdiar, Thiruvananthapuram",
        "East Fort, Thrissur",
        "Nadakkavu, Kozhikode"
    ]
    fallback_index = 0

    for complaint in complaints:
        # Remove "[Demo] Title: " or "[Demo] Title:"
        if "[Demo] Title:" in complaint.description:
            parts = complaint.description.split("[Demo] Title:", 1)
            if len(parts) > 1:
                # The first line will be the title, let's keep it as is without the prefix
                # or just strip the prefix. The user said "remove the "[demo]title:""
                complaint.description = parts[1].strip()
        elif "[Demo]" in complaint.description:
            complaint.description = complaint.description.replace("[Demo]", "").strip()
            
        # Update location to Kerala
        new_loc = kerala_locations.get(complaint.category)
        if not new_loc:
            new_loc = fallback_locations[fallback_index % len(fallback_locations)]
            fallback_index += 1
            
        # Special case: Since we have 2 Potholes
        if complaint.category == "Pothole" and complaint.location != "Palayam, Thiruvananthapuram":
            new_loc = "Kowdiar, Thiruvananthapuram" if fallback_index == 0 else fallback_locations[fallback_index % len(fallback_locations)]

        complaint.location = new_loc
        complaint.save()
        print(f"Updated complaint {complaint.id}: Location={new_loc}")

if __name__ == '__main__':
    update_complaints()
