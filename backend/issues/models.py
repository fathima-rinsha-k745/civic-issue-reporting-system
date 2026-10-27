from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


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
        ('Awaiting Authority Verification', 'Awaiting Authority Verification'),
        ('Awaiting Citizen Confirmation', 'Awaiting Citizen Confirmation'),
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

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    image = models.ImageField(
        upload_to='complaints/',
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=50,
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

    assigned_staff_members = models.ManyToManyField(
        DepartmentStaff,
        through='ComplaintAssignment',
        related_name='assigned_complaints_m2m',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    rejection_reason = models.TextField(blank=True, null=True)
    rejected_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rejected_complaints'
    )
    rejected_at = models.DateTimeField(null=True, blank=True)

    verified_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_complaints'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.category} - {self.status}"


class ComplaintAssignment(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='assignments')
    staff = models.ForeignKey(DepartmentStaff, on_delete=models.CASCADE, related_name='assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints_by')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['complaint', 'staff'],
                condition=models.Q(is_active=True),
                name='unique_active_complaint_staff_assignment'
            )
        ]
        ordering = ['-assigned_at']

    def __str__(self):
        return f"Complaint #{self.complaint_id} -> {self.staff.user.get_full_name() or self.staff.user.username}"


class ComplaintCompletion(models.Model):
    RESPONSE_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Confirmed', 'Confirmed'),
        ('Disputed', 'Disputed'),
    ]

    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='completions')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_completions')
    completion_remarks = models.TextField(blank=True, default='')
    completion_image = models.ImageField(upload_to='completions/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_completions')
    verification_status = models.CharField(max_length=50, choices=RESPONSE_CHOICES, default='Pending')
    verification_remarks = models.TextField(blank=True, null=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    citizen_response = models.CharField(max_length=20, choices=RESPONSE_CHOICES, default='Pending')
    citizen_remarks = models.TextField(blank=True, null=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Completion for Complaint #{self.complaint_id} ({self.verification_status})"


class ComplaintFeedback(models.Model):
    complaint = models.OneToOneField(
        Complaint,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    citizen = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback for Complaint #{self.complaint_id} by {self.citizen.username} (Rating: {self.rating})"


class ComplaintStatusHistory(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50, choices=Complaint.STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.complaint.id} - {self.status} on {self.updated_at.strftime('%Y-%m-%d %H:%M')}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"