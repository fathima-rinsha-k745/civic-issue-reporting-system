from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count
from rest_framework.exceptions import ValidationError

from .serializers import RegisterSerializer, ComplaintSerializer, DepartmentSerializer, StaffSerializer
from .models import Complaint, Department, ComplaintStatusHistory, DepartmentStaff, UserProfile, User

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # To not perform the csrf check previously happening

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registration successful."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        expected_role = request.data.get('expected_role')
        
        if not email or not password:
            return Response({"error": "Please provide both email and password."}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            try:
                role = user.userprofile.role
            except:
                role = "CITIZEN"

            if expected_role and role != expected_role:
                return Response({"error": "Invalid role. Please use the correct login option for your account."}, status=status.HTTP_403_FORBIDDEN)

            login(request, user)
            return Response({
                "message": "Login successful",
                "role": role,
                "full_name": user.get_full_name() or user.email
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    authentication_classes = []
    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class DepartmentListCreateView(generics.ListCreateAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        return Department.objects.annotate(complaints_count=Count('complaints')).all()

    def perform_create(self, serializer):
        role = getattr(self.request.user.userprofile, 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            raise ValidationError("Only Municipal Authority can create departments.")
        serializer.save()

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def perform_update(self, serializer):
        role = getattr(self.request.user.userprofile, 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            raise ValidationError("Only Municipal Authority can update departments.")
        serializer.save()

    def perform_destroy(self, instance):
        role = getattr(self.request.user.userprofile, 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            raise ValidationError("Only Municipal Authority can delete departments.")
        instance.delete()

class StaffListCreateView(generics.ListCreateAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = StaffSerializer

    def get_queryset(self):
        return DepartmentStaff.objects.all()

    def perform_create(self, serializer):
        role = getattr(self.request.user.userprofile, 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            raise ValidationError("Only Municipal Authority can manage staff.")
        
        email = self.request.data.get('email')
        password = self.request.data.get('password')
        full_name = self.request.data.get('full_name', 'Staff')
        
        if not email or not password:
            raise ValidationError("Email and password are required.")
            
        if User.objects.filter(email=email).exists():
            raise ValidationError("User with this email already exists.")
            
        name_parts = full_name.split(' ', 1)
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else ''
        )
        UserProfile.objects.create(user=user, role='DEPARTMENT_STAFF')
        serializer.save(user=user)

class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = DepartmentStaff.objects.all()
    serializer_class = StaffSerializer

    def perform_update(self, serializer):
        role = getattr(self.request.user.userprofile, 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            raise ValidationError("Only Municipal Authority can manage staff.")
        
        is_active = self.request.data.get('is_active')
        instance = serializer.save()
        if is_active is not None:
            instance.user.is_active = is_active
            instance.user.save()

    def perform_destroy(self, instance):
        role = getattr(self.request.user.userprofile, 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            raise ValidationError("Only Municipal Authority can manage staff.")
        user = instance.user
        instance.delete()
        user.delete()


class ComplaintListCreateView(generics.ListCreateAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            role = user.userprofile.role
        except:
            role = 'CITIZEN'

        if role == 'CITIZEN':
            return Complaint.objects.filter(citizen=user).order_by('-created_at')
        elif role == 'MUNICIPAL_AUTHORITY':
            return Complaint.objects.all().order_by('-created_at')
        elif role == 'DEPARTMENT_STAFF':
            try:
                staff_dept = user.departmentstaff.department
                return Complaint.objects.filter(department=staff_dept).order_by('-created_at')
            except:
                return Complaint.objects.none()
        return Complaint.objects.none()

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user, status='Pending')
        ComplaintStatusHistory.objects.create(
            complaint=serializer.instance,
            status='Pending',
            remarks='Complaint Submitted',
            updated_by=self.request.user
        )

class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            role = user.userprofile.role
        except:
            role = 'CITIZEN'
            
        if role == 'CITIZEN':
            return Complaint.objects.filter(citizen=user)
        elif role == 'MUNICIPAL_AUTHORITY':
            return Complaint.objects.all()
        elif role == 'DEPARTMENT_STAFF':
            try:
                staff_dept = user.departmentstaff.department
                return Complaint.objects.filter(department=staff_dept)
            except:
                return Complaint.objects.none()
        return Complaint.objects.none()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        user = self.request.user
        try:
            role = user.userprofile.role
        except:
            role = 'CITIZEN'

        if role not in ['MUNICIPAL_AUTHORITY', 'DEPARTMENT_STAFF']:
            return Response({"error": "Only Authority or Staff can update complaints."}, status=status.HTTP_403_FORBIDDEN)

        old_status = instance.status
        old_department = instance.department
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        instance.refresh_from_db()
        remarks = request.data.get('remarks', '')

        if old_status != instance.status or old_department != instance.department:
            if not remarks:
                if old_department != instance.department:
                    remarks = f"Assigned to {instance.department.name if instance.department else 'No Department'}"
                else:
                    remarks = f"Status changed to {instance.status}"
            ComplaintStatusHistory.objects.create(
                complaint=instance,
                status=instance.status,
                remarks=remarks,
                updated_by=user
            )

        return Response(serializer.data)
