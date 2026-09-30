from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('CITIZEN', 'Citizen'),
        ('MUNICIPAL_AUTHORITY', 'Municipal Authority'),
        ('DEPARTMENT_STAFF', 'Department Staff'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class DepartmentStaff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='staff')

    def __str__(self):
        return f"{self.user.username} - {self.department.name}"

class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('Garbage', 'Garbage'),
        ('Pothole', 'Pothole'),
        ('Water Leakage', 'Water Leakage'),
        ('Drain Blockage', 'Drain Blockage'),
        ('Broken Streetlight', 'Broken Streetlight'),
        ('Sewage Overflow', 'Sewage Overflow'),
        ('Fallen Tree', 'Fallen Tree'),
        ('Public Property Damage', 'Public Property Damage'),
        ('Other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Rejected', 'Rejected'),
    ]

    citizen = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='complaints'
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    description = models.TextField()

    location = models.CharField(max_length=255)

    image = models.ImageField(
        upload_to='complaints/',
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Pending'
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints'
    )

    assigned_staff = models.ForeignKey(
        DepartmentStaff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - {self.status}"


class ComplaintStatusHistory(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Complaint.STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.complaint.id} - {self.status} on {self.updated_at.strftime('%Y-%m-%d %H:%M')}"