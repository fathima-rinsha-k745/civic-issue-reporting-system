from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Complaint, Department, ComplaintStatusHistory, DepartmentStaff

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
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True
    )

    class Meta:
        model = DepartmentStaff
        fields = ['id', 'user', 'email', 'full_name', 'department', 'department_name', 'department_id', 'is_active']
        read_only_fields = ['user', 'department']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class ComplaintStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintStatusHistory
        fields = ('status', 'remarks', 'updated_at')

class ComplaintSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    citizen_name = serializers.SerializerMethodField()
    status_history = ComplaintStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ('citizen', 'status', 'created_at', 'updated_at')

    def get_citizen_name(self, obj):
        if obj.citizen:
            return obj.citizen.get_full_name() or obj.citizen.email
        return None
