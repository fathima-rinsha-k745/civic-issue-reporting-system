# CivicConnect – Civic Issue Reporting and Management System

A web-based civic issue reporting and redressal platform designed to bridge the communication gap between citizens, municipal authorities, and ground-level department staff.

**GitHub Repository:** [https://github.com/fathima-rinsha-k745/civic-issue-reporting-system](https://github.com/fathima-rinsha-k745/civic-issue-reporting-system)

---

## Table of Contents

- [1. Project Introduction](#1-project-introduction)
  - [Purpose](#purpose)
  - [Problem Statement & Objectives](#problem-statement--objectives)
  - [User Roles](#user-roles)
- [2. Features](#2-features)
  - [Citizen Features](#citizen-features)
  - [Municipal Authority Features](#municipal-authority-features)
  - [Department Staff Features](#department-staff-features)
- [3. Technology Stack](#3-technology-stack)
  - [Active Implementation Stack](#active-implementation-stack)
  - [Planned Cloud Services (Deployment Architecture)](#planned-cloud-services-deployment-architecture)
- [4. Project Structure](#4-project-structure)
- [5. Installation and Setup](#5-installation-and-setup)
  - [Prerequisites](#prerequisites)
  - [Cloning the Repository](#cloning-the-repository)
  - [Backend Setup (Django & PostgreSQL)](#backend-setup-django--postgresql)
  - [Frontend Setup (React & Vite)](#frontend-setup-react--vite)
- [6. Demonstration Data](#6-demonstration-data)
  - [Running the Seed Command](#running-the-seed-command)
  - [Demonstration Accounts & Credentials](#demonstration-accounts--credentials)
  - [Complaint Data & Photographic Assets](#complaint-data--photographic-assets)
  - [Cleaning Up Demonstration Data](#cleaning-up-demonstration-data)
- [7. Testing & Verification](#7-testing--verification)
  - [Django System Checks](#django-system-checks)
  - [Backend Automated Tests](#backend-automated-tests)
  - [Frontend Production Build](#frontend-production-build)
- [8. Security & Access Control](#8-security--access-control)
- [9. Planned Deployment Architecture](#9-planned-deployment-architecture)

---

## 1. Project Introduction

### Purpose
**CivicConnect** is a comprehensive civic issue reporting and management web application built as an MCA mini-project. It streamlines the lifecycle of urban civic grievances—such as garbage overflow, potholes, broken streetlights, and drainage blockages—by providing a direct, transparent workflow connecting citizens, municipal authorities, and specialized department staff.

### Problem Statement & Objectives
- **Problem Statement:** In conventional municipal management, reporting civic issues often relies on manual paperwork, physical office visits, or disjointed communication channels. Citizens lack visibility into whether their grievances are being acted upon, while municipal bodies struggle with sorting, assigning, and monitoring ground-level resolution tasks.
- **Objectives:**
  1. Provide citizens with an accessible digital portal to log complaints with photographic evidence and exact location details.
  2. Equip municipal authorities with a centralized dashboard to triage, verify, and assign complaints to relevant civic departments.
  3. Empower department staff with a focused interface to view tasks assigned exclusively to their department and update progress status.
  4. Ensure end-to-end transparency through timestamped status histories and progress remarks.

### User Roles
The application strictly defines three distinct, cooperating user roles:
1. **Citizen:** Registers for an account, files civic grievances with photos and location data, monitors complaint progression, and updates their profile.
2. **Municipal Authority:** Acts as the central administrative body, oversees city-wide complaints, manages departments, creates and oversees department staff accounts, and dispatches complaints to relevant departments.
3. **Department Staff:** Ground-level workforce belonging to a specific municipal department (e.g., Sanitation, Public Works, Water Supply). Reviews complaints assigned to their department and updates the operational status (`Pending`, `In Progress`, `Resolved`, `Rejected`) with remarks.

---

## 2. Features

### Citizen Features
- **Account Registration & Authentication:** Secure signup and session-based login for citizens.
- **Submit Civic Complaints:** Report issues by selecting a category (Garbage, Pothole, Water Leakage, Drain Blockage, Broken Streetlight, Sewage Overflow, Fallen Tree, Public Property Damage, Other), providing a detailed description, entering specific location details, and uploading a photograph.
- **Personal Complaints Dashboard:** View all submitted complaints with status tags (`Pending`, `In Progress`, `Resolved`, `Rejected`) and submission timestamps.
- **Track Status & History:** Inspect detailed complaint views showing photographic evidence, assigned department, and a chronological history of status updates and staff remarks.
- **Profile Management:** View and edit personal profile information (name and email).

### Municipal Authority Features
- **Executive Dashboard:** High-level metrics showing total complaints, pending issues, in-progress tasks, and resolved grievances across the entire municipality.
- **Complaint Management & Triage:** View, search, and filter all complaints submitted across the city by department, status, and category.
- **Detailed Complaint Inspection:** Review complaint specifics, submitted photographs, citizen contact information, and audit logs.
- **Department Assignment:** Assign newly submitted or unassigned complaints to the appropriate municipal department.
- **Department Administration:** Create and manage municipal departments (e.g., Sanitation, Public Works, Water Supply, Electrical, Drainage, Parks & Public Spaces).
- **Staff Administration:** Create department staff accounts, assign them to their respective departments, toggle staff status, and view staff rosters.
- **Progress Oversight:** Track resolution efficiency and review status updates submitted by department staff.

### Department Staff Features
- **Authorized Staff Login:** Log in using credentials provisioned by the Municipal Authority.
- **Department-Restricted Task List:** Access an exclusive view containing only complaints assigned to the staff member's department.
- **Complaint Details & Media:** Inspect assigned complaint descriptions, locations, and uploaded photographs.
- **Status Updates & Progress Remarks:** Transition complaint status (`Pending` -> `In Progress` -> `Resolved` / `Rejected`) and record field remarks for citizen and authority review.
- **Personal Staff Profile:** View assigned department information and profile details.

---

## 3. Technology Stack

### Active Implementation Stack
| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React.js (v19), HTML5, CSS3, JavaScript (ES6+) | Component-driven Single-Page Application (SPA) |
| **Styling & UI** | React-Bootstrap, Bootstrap 5, React Icons, Custom CSS | Clean, responsive interface for mobile and desktop |
| **Routing & Build** | React Router DOM (v7), Vite | Client-side routing and optimized frontend tooling |
| **Backend** | Python 3.12, Django 6.0, Django REST Framework (DRF) | RESTful API architecture, role-based views, session auth |
| **Database** | PostgreSQL | Relational database storing users, roles, departments, complaints, and status history |
| **Media Handling** | Pillow (PIL) | Server-side image upload processing and validation |
| **CORS & Auth** | django-cors-headers, Django Session Auth | Cross-origin resource sharing and session authentication |
| **Version Control** | Git, GitHub | Distributed version control and source code repository |

### Planned Cloud Services (Deployment Architecture)
> **Note:** The following cloud services represent the planned production deployment architecture for the system and are distinct from the currently configured local development environment:

- **Frontend Hosting:** AWS Amplify (Automated CI/CD build and hosting for the React SPA).
- **Backend Application Server:** AWS EC2 (Ubuntu Linux instance running Gunicorn WSGI behind an Nginx reverse proxy).
- **Database Server:** Amazon RDS for PostgreSQL (Managed relational database with automated backups and security groups).
- **Media Storage:** Amazon S3 (Object storage bucket for user-uploaded complaint photographs).

---

## 4. Project Structure

```text
civic-issue-reporting-system/
├── backend/
│   ├── config/                     # Django project configuration
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py             # Settings, DB config, CORS, media settings
│   │   ├── urls.py                 # Root URL configuration (/api/, /admin/)
│   │   └── wsgi.py
│   ├── issues/                     # Core application for issues & users
│   │   ├── management/
│   │   │   └── commands/
│   │   │       ├── seed_demo_data.py   # Demonstration data seeding command
│   │   │       └── seed_demo_staff.py  # Department staff seeding command
│   │   ├── migrations/             # Database schema migrations
│   │   ├── admin.py                # Django Admin configuration
│   │   ├── apps.py                 # App configuration
│   │   ├── models.py               # UserProfile, Department, DepartmentStaff, Complaint, ComplaintStatusHistory
│   │   ├── profile_view.py         # Profile API endpoints (GET, PATCH)
│   │   ├── serializers.py          # DRF serializers for auth, complaints, departments, staff
│   │   ├── urls.py                 # Issues API route definitions
│   │   └── views.py                # ViewSets and APIViews for auth, complaints, departments, staff
│   ├── demo_assets/                # Photographic assets used during demo data seeding
│   ├── media/                      # Local storage for user-uploaded complaint images
│   ├── manage.py                   # Django management script
│   └── test_profile.py             # Automated APITestCase suite for profile & auth endpoints
├── frontend/
│   ├── public/                     # Static public assets
│   ├── src/
│   │   ├── assets/                 # Frontend logos and images
│   │   ├── components/             # Reusable UI components
│   │   │   ├── authority/          # Authority sidebar and widgets
│   │   │   ├── citizen/            # Citizen sidebar and widgets
│   │   │   ├── layout/             # Header, Footer, AuthorityLayout, CitizenLayout, StaffLayout
│   │   │   └── staff/              # Staff sidebar and widgets
│   │   ├── pages/                  # Page-level components
│   │   │   ├── authority/          # Dashboard, ComplaintList, ComplaintDetails, Departments, Staff
│   │   │   ├── citizen/            # Dashboard, SubmitComplaint, MyComplaints, ComplaintDetails, Profile
│   │   │   ├── staff/              # Dashboard, AssignedComplaints, ComplaintDetails, Profile
│   │   │   ├── About.jsx           # About page
│   │   │   ├── Contact.jsx         # Contact page
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Login.jsx           # Role-based login page
│   │   │   ├── Register.jsx        # Citizen registration page
│   │   │   └── Services.jsx        # Services description page
│   │   ├── services/
│   │   │   └── api.js              # Centralized API service layer
│   │   ├── App.css
│   │   ├── App.jsx                 # Application routes and role-based route guards
│   │   ├── index.css               # Global CSS styling
│   │   └── main.jsx                # React root entry point
│   ├── index.html
│   ├── package.json                # Frontend package dependencies and scripts
│   └── vite.config.js              # Vite bundler configuration and proxy settings
├── DEMO_README.md                  # Detailed demonstration walkthrough guide
└── README.md                       # Main repository documentation
```

---

## 5. Installation and Setup

Follow the steps below to configure and run the project locally on Windows.

### Prerequisites
- **Python:** Version 3.12 or later installed.
- **Node.js:** Version 18 or later (with npm).
- **PostgreSQL:** Installed and running locally on port 5432.
- **Git:** Installed on your machine.

---

### Cloning the Repository
```bash
git clone https://github.com/fathima-rinsha-k745/civic-issue-reporting-system.git
cd civic-issue-reporting-system
```

---

### Backend Setup (Django & PostgreSQL)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment (Windows):**
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install backend dependencies:**
   ```bash
   pip install django djangorestframework django-cors-headers psycopg2-binary pillow
   ```

4. **Configure PostgreSQL Database:**
   Ensure PostgreSQL is running and create the database:
   ```sql
   CREATE DATABASE civic_issue_db;
   ```
   Verify or adjust database connection parameters in `backend/config/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'civic_issue_db',
           'USER': 'postgres',
           'PASSWORD': 'your_postgres_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

5. **Apply Database Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the Django Development Server:**
   ```bash
   python manage.py runserver
   ```
   The backend API will be accessible at `http://127.0.0.1:8000/`.

---

### Frontend Setup (React & Vite)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm run dev
   ```
   The application will start at `http://localhost:5173/`.

---

## 6. Demonstration Data

The project includes an idempotent management command to populate the database with realistic demonstration accounts, municipal departments, complaints, and photographs.

### Running the Seed Command
From the `backend` directory with your virtual environment activated:
```bash
python manage.py seed_demo_data
```

### Demonstration Accounts & Credentials
All demonstration accounts are provisioned with the password: `demo123`

| Role | Username / Email | Department | Purpose / Features Demonstrated |
|---|---|---|---|
| **Citizen** | `citizen@example.com` | N/A | Submitting complaints, tracking resolution progress |
| **Municipal Authority** | `authority@example.com` | N/A | Central dashboard, assigning departments, managing staff |
| **Department Staff** | `staff_sanitation@example.com` | Sanitation Department | Managing garbage and cleanliness issues |
| **Department Staff** | `staff_pwd@example.com` | Public Works Department | Managing potholes, pavements, and road obstacles |
| **Department Staff** | `staff_water@example.com` | Water Supply Department | Managing pipeline leaks and tap repairs |
| **Department Staff** | `staff_electrical@example.com` | Electrical Department | Managing damaged or non-functional streetlights |
| **Department Staff** | `staff_drainage@example.com` | Drainage Department | Managing blocked drains and sewage overflow |
| **Department Staff** | `staff_parks@example.com` | Parks and Public Spaces Department | Managing damaged benches and park infrastructure |

### Complaint Data & Photographic Assets
- The seed script injects **12 realistic sample complaints** across all 6 departments with diverse statuses (`Pending`, `In Progress`, `Resolved`).
- Photographic assets from `backend/demo_assets/` (e.g., `garbage.jpg`, `pothole.jpg`, `leakage.jpg`, `streetlight.jpg`, `drain.jpg`, `bench.jpg`) are copied to Django's `media/complaints/` directory and linked to the corresponding complaint records.
- Each complaint includes an initial `Pending` status history entry, and complaints marked `In Progress` or `Resolved` contain corresponding timestamped status history entries with staff remarks.

### Cleaning Up Demonstration Data
If you wish to remove demo accounts and their associated complaints without resetting your database:
```bash
python manage.py shell
```
Run the following Python script inside the shell:
```python
from django.contrib.auth.models import User
User.objects.filter(email__in=[
    'citizen@example.com', 'authority@example.com', 'staff_sanitation@example.com',
    'staff_pwd@example.com', 'staff_water@example.com', 'staff_electrical@example.com',
    'staff_drainage@example.com', 'staff_parks@example.com'
]).delete()
```
For additional demonstration scenarios, refer to [DEMO_README.md](DEMO_README.md).

---

## 7. Testing & Verification

The project includes system checks, automated test suites, and frontend build validations.

### Django System Checks
Verify model relationships, settings, and configuration without errors:
```bash
python manage.py check
```
*Status: Verified — 0 issues identified.*

### Backend Automated Tests
Run the Django automated test suite:
```bash
python manage.py test
```
*Status: Verified — All 11 tests pass.*

**Test Coverage in `test_profile.py`:**
- `test_unauthenticated_profile_access`: Confirms unauthenticated access to `/api/profile/` is denied (`401`/`403`).
- `test_unauthenticated_profile_update`: Confirms unauthenticated patch attempts are rejected.
- `test_citizen_profile_access`: Validates authenticated Citizen profile response structure and null department.
- `test_authority_profile_access`: Validates Municipal Authority profile structure.
- `test_department_staff_profile_access`: Validates Department Staff profile returns the associated department name.
- `test_profile_access_without_userprofile`: Confirms fallback to `CITIZEN` role if a profile record is absent.
- `test_profile_update_full_name`: Validates splitting and updating first and last names in the database.
- `test_profile_update_single_name`: Validates single-token full name handling.
- `test_profile_update_email_success`: Validates updating email and matching username synchronization.
- `test_profile_update_duplicate_email`: Validates rejection of duplicate email with `400 Bad Request`.
- `test_login_and_get_update_profile_session_flow`: End-to-end integration test validating the login -> get profile -> update profile session flow using DRF's API test client.

### Frontend Production Build
Validate that all React JSX components and dependencies build cleanly:
```bash
cd frontend
npm run build
```
*Status: Verified — Production bundle generated successfully via Vite.*

---

## 8. Security & Access Control

1. **Credential & Environment Security:**
   - Production secrets, secret keys, and database passwords must not be committed to source control.
   - Use environment variables (`.env` file) for sensitive configuration in production.
2. **Password Hashing:**
   - User passwords are never stored in plain text. Django's PBKDF2 password hasher with SHA-256 is used for secure one-way hashing.
3. **Role-Based Access Control (RBAC):**
   - API endpoints enforce permission checks (`IsAuthenticated` and role validation).
   - **Citizens** are restricted to viewing and managing only their own submitted complaints (`citizen=request.user`).
   - **Department Staff** are restricted to viewing and modifying complaints assigned exclusively to their department.
   - **Municipal Authorities** possess administrative privileges to inspect all complaints city-wide and assign departments.
4. **Media Storage Security:**
   - Uploaded complaint photographs are validated upon upload and stored within the designated `media/complaints/` directory.
   - In production, cloud storage access permissions (e.g., Amazon S3 bucket policies) should restrict direct modification of media assets.

---

## 9. Planned Deployment Architecture

The following cloud architecture is planned for hosting CivicConnect in a production environment:

| Component | Planned Cloud Service | Purpose & Setup |
|---|---|---|
| **Frontend** | AWS Amplify | Continuous deployment from the Git repository, hosting the static React single-page application on AWS CDN. |
| **Backend API** | AWS EC2 (Elastic Compute Cloud) | Linux virtual server running Django and Django REST Framework using Gunicorn as the WSGI server behind an Nginx reverse proxy. |
| **Database** | Amazon RDS for PostgreSQL | Fully managed PostgreSQL instance with automated backups, multi-AZ options, and VPC security groups. |
| **Photo Storage** | Amazon S3 (Simple Storage Service) | Highly scalable object storage bucket configured via `django-storages` to store citizen complaint photographs. |

---

## 10. Summary

CivicConnect provides an integrated, structured platform to manage urban grievances efficiently. By combining a modern React frontend, a scalable Django REST backend, and a relational PostgreSQL database, the system ensures transparency and responsiveness across every stage of civic issue resolution.
