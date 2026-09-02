from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
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

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - {self.status}"