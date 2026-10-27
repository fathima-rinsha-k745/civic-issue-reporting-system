from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Complaint, Department, ComplaintStatusHistory, 
    DepartmentStaff, ComplaintAssignment, ComplaintCompletion, Notification,
    ComplaintFeedback
)

class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name')
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        if User.objects.filter(username=value).exists():
             raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')
        full_name = validated_data.get('full_name')
        
        # Extract first and last name from full_name if possible
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Use email as the username since Django requires a username
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Create the UserProfile with role=CITIZEN
        UserProfile.objects.create(
            user=user,
            role='CITIZEN'
        )

        return user

class DepartmentSerializer(serializers.ModelSerializer):
    complaints_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Department
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    is_generic = serializers.SerializerMethodField(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True
    )

    class Meta:
        model = DepartmentStaff
        fields = ['id', 'user', 'email', 'full_name', 'department', 'department_name', 'department_id', 'is_active', 'is_generic']
        read_only_fields = ['user', 'department']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_is_generic(self, obj):
        full_name = (obj.user.get_full_name() or '').strip().lower()
        email = (obj.user.email or '').strip().lower()
        return ('department staff' in full_name) or (email.startswith('staff_') and '@example.com' in email)


class ComplaintAssignmentSerializer(serializers.ModelSerializer):
    staff_id = serializers.IntegerField(source='staff.id', read_only=True)
    user_id = serializers.IntegerField(source='staff.user.id', read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    staff_name = serializers.SerializerMethodField(read_only=True)
    email = serializers.EmailField(source='staff.user.email', read_only=True)
    staff_email = serializers.EmailField(source='staff.user.email', read_only=True)
    department_id = serializers.IntegerField(source='staff.department.id', read_only=True)
    department_name = serializers.CharField(source='staff.department.name', read_only=True)
    assigned_at = serializers.SerializerMethodField(read_only=True)
    assigned_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ComplaintAssignment
        fields = [
            'id', 'staff_id', 'user_id', 'name', 'staff_name',
            'email', 'staff_email', 'department_id', 'department_name',
            'assigned_at', 'assigned_by_name', 'is_active'
        ]

    def get_name(self, obj):
        return obj.staff.user.get_full_name() or obj.staff.user.email

    def get_staff_name(self, obj):
        return self.get_name(obj)

    def get_assigned_at(self, obj):
        return obj.assigned_at.strftime('%Y-%m-%d %H:%M') if obj.assigned_at else None

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.email
        return None


class ComplaintCompletionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField(read_only=True)
    submitted_at_formatted = serializers.SerializerMethodField(read_only=True)
    verified_by_name = serializers.SerializerMethodField(read_only=True)
    verified_at_formatted = serializers.SerializerMethodField(read_only=True)
    responded_at_formatted = serializers.SerializerMethodField(read_only=True)
    completion_photo = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ComplaintCompletion
        fields = [
            'id', 'complaint', 'submitted_by', 'submitted_by_name',
            'completion_remarks', 'completion_image', 'completion_photo',
            'submitted_at', 'submitted_at_formatted',
            'verification_status', 'verification_remarks',
            'verified_by', 'verified_by_name', 'verified_at', 'verified_at_formatted',
            'citizen_response', 'citizen_remarks', 'responded_at', 'responded_at_formatted'
        ]
        extra_kwargs = {
            'completion_remarks': {'required': False, 'allow_blank': True}
        }

    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return obj.submitted_by.get_full_name() or obj.submitted_by.email
        return 'Staff'

    def get_submitted_at_formatted(self, obj):
        return obj.submitted_at.strftime('%Y-%m-%d %H:%M') if obj.submitted_at else None

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            name = obj.verified_by.get_full_name().strip()
            return name if name and '@' not in name else 'Municipal Authority'
        return None

    def get_verified_at_formatted(self, obj):
        return obj.verified_at.strftime('%Y-%m-%d %H:%M') if obj.verified_at else None

    def get_responded_at_formatted(self, obj):
        return obj.responded_at.strftime('%Y-%m-%d %H:%M') if obj.responded_at else None

    def get_completion_photo(self, obj):
        return obj.completion_image.url if obj.completion_image else None


class ComplaintFeedbackSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField(read_only=True)
    created_at_formatted = serializers.SerializerMethodField(read_only=True)
    updated_at_formatted = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ComplaintFeedback
        fields = [
            'id', 'complaint', 'citizen', 'citizen_name',
            'rating', 'comment', 'created_at', 'created_at_formatted',
            'updated_at', 'updated_at_formatted'
        ]
        read_only_fields = ('citizen', 'created_at', 'updated_at')

    def get_citizen_name(self, obj):
        if obj.citizen:
            name = obj.citizen.get_full_name().strip()
            return name if name and '@' not in name else obj.citizen.email
        return 'Citizen'

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M') if obj.created_at else None

    def get_updated_at_formatted(self, obj):
        return obj.updated_at.strftime('%Y-%m-%d %H:%M') if obj.updated_at else None

    def validate_rating(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5 stars.")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    created_at_formatted = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'complaint', 'is_read', 'created_at', 'created_at_formatted']

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%Y-%m-%d %H:%M') if obj.created_at else None


class ComplaintStatusHistorySerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()
    updated_by_role = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintStatusHistory
        fields = (
            'id', 'status', 'remarks', 'updated_at', 'date',
            'updated_by', 'updated_by_name', 'updated_by_role', 'action_label'
        )

    def get_updated_by_name(self, obj):
        if not obj.updated_by:
            return 'System'
        full_name = obj.updated_by.get_full_name().strip()
        if full_name == 'Authority One':
            return 'Municipal Authority'
        if full_name == 'Citizen One':
            if obj.complaint and obj.complaint.citizen:
                c_name = obj.complaint.citizen.get_full_name().strip()
                if c_name and c_name != 'Citizen One':
                    return c_name
                if obj.complaint.citizen.email and obj.complaint.citizen.email != 'citizen@example.com':
                    return obj.complaint.citizen.email
            return 'Citizen'
        if full_name and '@' not in full_name:
            return full_name

        # Role-based fallback when full_name is empty or an email
        role = getattr(getattr(obj.updated_by, 'userprofile', None), 'role', None)
        if role == 'MUNICIPAL_AUTHORITY':
            return 'Municipal Authority'
        elif role == 'DEPARTMENT_STAFF':
            try:
                dept = obj.updated_by.departmentstaff.department
                return f"{dept.name} Staff"
            except Exception:
                return 'Department Staff'
        elif role == 'CITIZEN':
            if obj.complaint and obj.complaint.citizen:
                c_name = obj.complaint.citizen.get_full_name().strip()
                if c_name and c_name != 'Citizen One' and '@' not in c_name:
                    return c_name
                if obj.complaint.citizen.email and obj.complaint.citizen.email != 'citizen@example.com':
                    return obj.complaint.citizen.email
            return 'Citizen'
        return 'System'

    def get_updated_by_role(self, obj):
        if obj.updated_by:
            return getattr(getattr(obj.updated_by, 'userprofile', None), 'role', None)
        return None

    def get_action_label(self, obj):
        actor = self.get_updated_by_name(obj)
        role = self.get_updated_by_role(obj)
        remarks = (obj.remarks or '').strip().lower()

        if obj.status == 'Pending':
            if 'assigned' in remarks:
                return f"Assigned by {actor}"
            return f"Submitted by {actor}"
        elif 'work started' in remarks:
            return f"Work started by {actor}"
        elif 'assigned' in remarks or (role == 'MUNICIPAL_AUTHORITY' and obj.status == 'In Progress'):
            return f"Assigned by {actor}"
        elif obj.status in ['Awaiting Authority Verification', 'Awaiting Citizen Confirmation']:
            return f"Completion submitted by {actor}"
        elif obj.status == 'Resolved':
            return f"Approved and Resolved by {actor}" if role == 'MUNICIPAL_AUTHORITY' else f"Resolved by {actor}"
        elif 'verification rejected' in remarks or 'returned to in progress' in remarks:
            return f"Returned to In Progress by {actor}"
        elif 'not fixed' in remarks or 'reopen' in remarks or (role == 'CITIZEN' and obj.status == 'In Progress'):
            return f"Reopened by {actor}"
        elif obj.status == 'Rejected':
            return f"Rejected by {actor}"
        elif actor and actor != 'System':
            return f"Updated by {actor}"
        return "Updated by System"

    def get_date(self, obj):
        if obj.updated_at:
            return obj.updated_at.strftime('%Y-%m-%d %H:%M')
        return 'N/A'


class ComplaintSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    citizen_name = serializers.SerializerMethodField()
    citizen_email = serializers.EmailField(source='citizen.email', read_only=True)
    status_history = ComplaintStatusHistorySerializer(many=True, read_only=True)
    assigned_staff_members = serializers.SerializerMethodField(read_only=True)
    assigned_staff_ids = serializers.SerializerMethodField(read_only=True)
    latest_completion = serializers.SerializerMethodField(read_only=True)
    completions = serializers.SerializerMethodField(read_only=True)
    feedback = serializers.SerializerMethodField(read_only=True)
    completion_photo = serializers.SerializerMethodField(read_only=True)
    rejected_by_name = serializers.SerializerMethodField(read_only=True)
    rejected_at_formatted = serializers.SerializerMethodField(read_only=True)
    verified_by_name = serializers.SerializerMethodField(read_only=True)
    verified_at_formatted = serializers.SerializerMethodField(read_only=True)
    is_assigned_to_current_user = serializers.SerializerMethodField(read_only=True)
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ('citizen', 'created_at', 'updated_at', 'rejected_by', 'rejected_at', 'verified_by', 'verified_at')

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()
        
        # Convert empty strings or round coordinates to 6 decimal places
        if 'latitude' in data:
            if data['latitude'] == '' or data['latitude'] == 'null' or data['latitude'] is None:
                data['latitude'] = None
            else:
                try:
                    data['latitude'] = f"{round(float(data['latitude']), 6):.6f}"
                except (ValueError, TypeError):
                    pass

        if 'longitude' in data:
            if data['longitude'] == '' or data['longitude'] == 'null' or data['longitude'] is None:
                data['longitude'] = None
            else:
                try:
                    data['longitude'] = f"{round(float(data['longitude']), 6):.6f}"
                except (ValueError, TypeError):
                    pass
            
        return super().to_internal_value(data)

    def validate_latitude(self, value):
        if value is not None:
            try:
                val = float(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Invalid latitude numeric value.")
            if val < -90 or val > 90:
                raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None:
            try:
                val = float(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Invalid longitude numeric value.")
            if val < -180 or val > 180:
                raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate(self, attrs):
        lat = attrs.get('latitude')
        lng = attrs.get('longitude')
        if (lat is not None and lng is None) or (lat is None and lng is not None):
            raise serializers.ValidationError("Both latitude and longitude must be provided together.")
        return attrs

    def get_citizen_name(self, obj):
        if obj.citizen:
            full_name = obj.citizen.get_full_name().strip()
            if full_name and full_name != 'Citizen One':
                return full_name
            if obj.citizen.email and obj.citizen.email != 'citizen@example.com':
                return obj.citizen.email
            return full_name or 'Citizen'
        return None

    def get_assigned_staff_members(self, obj):
        active_assignments = obj.assignments.filter(is_active=True).select_related('staff__user', 'staff__department')
        return ComplaintAssignmentSerializer(active_assignments, many=True).data

    def get_assigned_staff_ids(self, obj):
        return list(obj.assignments.filter(is_active=True).values_list('staff_id', flat=True))

    def get_latest_completion(self, obj):
        latest = obj.completions.first()
        return ComplaintCompletionSerializer(latest).data if latest else None

    def get_completions(self, obj):
        return ComplaintCompletionSerializer(obj.completions.all()[:10], many=True).data

    def get_feedback(self, obj):
        if hasattr(obj, 'feedback') and obj.feedback:
            return ComplaintFeedbackSerializer(obj.feedback).data
        return None

    def get_completion_photo(self, obj):
        latest = obj.completions.first()
        if latest and latest.completion_image:
            return latest.completion_image.url
        return None

    def get_rejected_by_name(self, obj):
        if obj.rejected_by:
            name = obj.rejected_by.get_full_name().strip()
            if name and '@' not in name and name != 'Authority One':
                return name
            return 'Municipal Authority'
        return None

    def get_rejected_at_formatted(self, obj):
        return obj.rejected_at.strftime('%Y-%m-%d %H:%M') if obj.rejected_at else None

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            name = obj.verified_by.get_full_name().strip()
            if name and '@' not in name and name != 'Authority One':
                return name
            return 'Municipal Authority'
        return None

    def get_verified_at_formatted(self, obj):
        return obj.verified_at.strftime('%Y-%m-%d %H:%M') if obj.verified_at else None

    def get_is_assigned_to_current_user(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            if obj.assignments.filter(staff__user=user, is_active=True).exists():
                return True
            if obj.assigned_staff and obj.assigned_staff.user_id == user.id:
                return True
        return False

