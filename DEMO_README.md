# CivicConnect Demonstration Guide

This guide explains how to populate the CivicConnect database with realistic demonstration data, allowing you to easily present the platform's features (such as image uploads, complaint tracking, and department assignments) during your MCA project presentation.

## 1. How to Seed Demonstration Data

We have provided a custom Django management command that securely injects 12 realistic sample complaints (with authentic photographic assets) and sets up demonstration users across all roles without interfering with your existing data structures.

**To run the seed script:**
1. Open your terminal and navigate to your `backend` directory.
2. Ensure your virtual environment is active.
3. Run the following command:
   ```bash
   python manage.py seed_demo_data
   ```

*Note: This script is idempotent. Running it multiple times will not create duplicate departments or duplicate identical complaints.*

## 2. Demonstration Accounts

The script provisions the following accounts with the password: `demo123`

### Citizen Role
- **Username:** `demo_citizen`
- **Purpose:** Use this account to demonstrate how citizens track their submitted complaints. It comes pre-populated with 12 complaints in various statuses (Pending, In Progress, Resolved) complete with location details and realistic images.

### Municipal Authority Role
- **Username:** `demo_authority`
- **Purpose:** Log in here to demonstrate the high-level dashboard. The authority can see all 12 complaints across the city, filter them by status, view their attached photographs, and assign "Pending" complaints to appropriate departments.

### Department Staff Roles
Staff accounts are assigned to specific departments. Log into these to demonstrate how staff members review their assigned tasks and update the complaint statuses.
- **Sanitation Staff:** `staff_sanitation` (Handles garbage and dustbin issues)
- **Public Works Staff:** `staff_pwd` (Handles potholes, fallen trees, and broken pavements)
- **Water Supply Staff:** `staff_water` (Handles leaking pipes and taps)
- **Electrical Staff:** `staff_electrical` (Handles broken streetlights)
- **Drainage Staff:** `staff_drainage` (Handles blocked drains and sewage overflow)
- **Parks & Public Spaces Staff:** `staff_parks` (Handles damaged park benches)

## 3. How to Remove Demonstration Data

If you need to clear the demonstration data from your database (for example, before a production deployment), you can safely remove it via the Django shell. 

1. Open the Django shell:
   ```bash
   python manage.py shell
   ```
2. Run the following Python commands to delete the demo users (which will automatically cascade and delete their demo complaints and history):
   ```python
   from django.contrib.auth.models import User
   User.objects.filter(username__in=[
       'demo_citizen', 'demo_authority', 'staff_sanitation', 
       'staff_pwd', 'staff_water', 'staff_electrical', 
       'staff_drainage', 'staff_parks'
   ]).delete()
   ```

*Note: This safely removes only the demonstration accounts and the complaints they created, leaving any real user data completely intact.*
