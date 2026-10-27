from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import ValidationError

from .serializers import (
    RegisterSerializer, ComplaintSerializer, DepartmentSerializer, 
    StaffSerializer, NotificationSerializer, ComplaintCompletionSerializer,
    ComplaintFeedbackSerializer
)
from .models import (
    Complaint, Department, ComplaintStatusHistory, DepartmentStaff, 
    UserProfile, User, ComplaintAssignment, ComplaintCompletion, Notification,
    ComplaintFeedback
)

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

            department_name = None
            staff_id = None
            if role == 'DEPARTMENT_STAFF':
                try:
                    department_name = user.departmentstaff.department.name
                    staff_id = user.departmentstaff.id
                except Exception:
                    department_name = None

            login(request, user)
            full_name = user.get_full_name().strip() if user.get_full_name() else ""
            if not full_name:
                full_name = user.first_name.strip() if user.first_name else ""
            if not full_name:
                full_name = user.username.strip() if user.username and '@' not in user.username else ""
            if not full_name:
                full_name = user.email.strip() if user.email else ""

            return Response({
                "message": "Login successful",
                "role": role,
                "id": user.id,
                "user_id": user.id,
                "staff_id": staff_id,
                "full_name": full_name,
                "first_name": user.first_name,
                "username": user.username,
                "email": user.email,
                "department": department_name
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
        user = self.request.user
        role = getattr(getattr(user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return DepartmentStaff.objects.none()
        qs = DepartmentStaff.objects.select_related('user', 'department').all()
        dept_id = self.request.query_params.get('department')
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if str(is_active).lower() in ['true', '1']:
                qs = qs.filter(user__is_active=True)
            elif str(is_active).lower() in ['false', '0']:
                qs = qs.filter(user__is_active=False)
        return qs

    def create(self, request, *args, **kwargs):
        role = getattr(getattr(self.request.user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return Response({"error": "Only Municipal Authority can manage staff."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        role = getattr(getattr(self.request.user, 'userprofile', None), 'role', 'CITIZEN')
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

    def get_queryset(self):
        user = self.request.user
        role = getattr(getattr(user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return DepartmentStaff.objects.none()
        return DepartmentStaff.objects.all()

    def update(self, request, *args, **kwargs):
        role = getattr(getattr(self.request.user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return Response({"error": "Only Municipal Authority can manage staff."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        role = getattr(getattr(self.request.user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return Response({"error": "Only Municipal Authority can manage staff."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        is_active = self.request.data.get('is_active')
        instance = serializer.save()
        if is_active is not None:
            instance.user.is_active = is_active
            instance.user.save()

    def perform_destroy(self, instance):
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
                staff = user.departmentstaff
                # Return complaints in staff's department that are assigned to this staff member,
                # or unassigned department complaints
                return Complaint.objects.filter(
                    Q(assignments__staff=staff, assignments__is_active=True) |
                    Q(department=staff.department, assignments__is_active=True, assignments__staff=staff) |
                    Q(department=staff.department, assignments__isnull=True)
                ).distinct().order_by('-created_at')
            except:
                return Complaint.objects.none()
        return Complaint.objects.none()

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to submit complaint: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        complaint = serializer.save(citizen=self.request.user, status='Pending')
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
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
                staff = user.departmentstaff
                return Complaint.objects.filter(
                    Q(assignments__staff=staff, assignments__is_active=True) |
                    Q(department=staff.department)
                ).distinct()
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

        # Complaints in Resolved or Rejected cannot be modified
        if instance.status == 'Resolved':
            return Response({"error": "Cannot modify an already resolved complaint."}, status=status.HTTP_400_BAD_REQUEST)
        if instance.status == 'Rejected':
            return Response({"error": "Cannot modify a rejected complaint."}, status=status.HTTP_400_BAD_REQUEST)

        # Staff must not be allowed to mark complaints directly as Resolved.
        # Only the Municipal Authority can approve completion and mark a complaint as Resolved.
        if request.data.get('status') == 'Resolved':
            if role == 'DEPARTMENT_STAFF':
                return Response(
                    {"error": "Department staff cannot mark a complaint as Resolved directly. Please upload a completion photo and remarks for authority verification."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if instance.status not in ['Awaiting Authority Verification', 'Awaiting Citizen Confirmation']:
                return Response(
                    {"error": "Complaints cannot be marked as Resolved directly; they can only be resolved through the authority verification process after work completion is submitted."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Handling Rejection via PATCH
        if request.data.get('status') == 'Rejected':
            if role != 'MUNICIPAL_AUTHORITY':
                return Response({"error": "Department staff cannot reject complaints."}, status=status.HTTP_403_FORBIDDEN)
            if instance.status != 'Pending':
                return Response({"error": "Complaints can only be rejected while in Pending status."}, status=status.HTTP_400_BAD_REQUEST)
            if instance.department is not None or instance.assignments.filter(is_active=True).exists():
                return Response({"error": "Complaints that have already been assigned to a department or staff cannot be rejected."}, status=status.HTTP_400_BAD_REQUEST)
            rejection_reason = request.data.get('rejection_reason', '').strip() or request.data.get('remarks', '').strip()
            if not rejection_reason:
                return Response({"error": "A rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                instance.status = 'Rejected'
                instance.rejection_reason = rejection_reason
                instance.rejected_by = user
                instance.rejected_at = timezone.now()
                instance.save()

                ComplaintStatusHistory.objects.create(
                    complaint=instance,
                    status='Rejected',
                    remarks=f"Rejection reason: {rejection_reason}",
                    updated_by=user
                )

                Notification.objects.create(
                    user=instance.citizen,
                    title=f"Complaint #{instance.id} Rejected",
                    message=f"Your complaint regarding {instance.category} was rejected by Municipal Authority. Reason: {rejection_reason}",
                    complaint=instance
                )
            return Response(ComplaintSerializer(instance).data)

        # Staff can only update status to In Progress for complaints explicitly assigned to them
        if role == 'DEPARTMENT_STAFF':
            staff_dept = getattr(getattr(user, 'departmentstaff', None), 'department', None)
            if instance.department != staff_dept:
                return Response({"error": "You do not have permission to update complaints from another department."}, status=status.HTTP_403_FORBIDDEN)
            
            has_assignments = instance.assignments.filter(is_active=True).exists() or bool(instance.assigned_staff)
            is_assigned = instance.assignments.filter(staff__user=user, is_active=True).exists()
            if not is_assigned and instance.assigned_staff and instance.assigned_staff.user_id == user.id:
                is_assigned = True

            target_status = request.data.get('status')
            if has_assignments and not is_assigned:
                return Response({"error": "You are not assigned to this complaint."}, status=status.HTTP_403_FORBIDDEN)

            if target_status and target_status not in ['Pending', 'In Progress']:
                return Response({"error": "Staff can only update status to In Progress."}, status=status.HTTP_400_BAD_REQUEST)

        # Municipal Authority must not mark complaints as In Progress directly
        if role == 'MUNICIPAL_AUTHORITY' and request.data.get('status') == 'In Progress' and not (request.data.get('department') or request.data.get('assigned_staff_ids')):
            return Response({"error": "Municipal Authority cannot mark complaints as In Progress."}, status=status.HTTP_400_BAD_REQUEST)

        dept_changed = False
        staff_changed = False

        if role == 'DEPARTMENT_STAFF':
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data.pop('latitude', None)
            data.pop('longitude', None)
            data.pop('location', None)
            data.pop('department', None)
            data.pop('assigned_staff_ids', None)
        else:
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            # Authority assignment does not change status
            data.pop('status', None)

        # Handle Municipal Authority assigning department and multiple staff
        if role == 'MUNICIPAL_AUTHORITY':
            new_dept_id = data.get('department')
            assigned_staff_ids = data.get('assigned_staff_ids')

            with transaction.atomic():
                target_dept = instance.department
                if new_dept_id is not None:
                    try:
                        new_dept = Department.objects.get(id=new_dept_id)
                        if instance.department != new_dept:
                            instance.department = new_dept
                            target_dept = new_dept
                            dept_changed = True
                            # If department changed, deactivate assignments from the old department
                            instance.assignments.filter(is_active=True).exclude(staff__department=new_dept).update(is_active=False)
                    except Department.DoesNotExist:
                        return Response({"error": "Selected department does not exist."}, status=status.HTTP_400_BAD_REQUEST)

                if assigned_staff_ids is not None:
                    if not target_dept:
                        return Response({"error": "Cannot assign staff without assigning a department."}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Validate all assigned staff belong to target_dept
                    staff_objs = list(DepartmentStaff.objects.filter(id__in=assigned_staff_ids, department=target_dept))
                    if len(staff_objs) != len(assigned_staff_ids):
                        return Response({"error": "All assigned staff must belong to the selected department."}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Validate all assigned staff are active
                    inactive_staff = [s for s in staff_objs if not s.user.is_active]
                    if inactive_staff:
                        return Response({"error": "Cannot assign inactive staff members to a complaint."}, status=status.HTTP_400_BAD_REQUEST)
                    
                    current_active_staff_ids = set(instance.assignments.filter(is_active=True).values_list('staff_id', flat=True))
                    new_staff_id_set = set(assigned_staff_ids)
                    if current_active_staff_ids != new_staff_id_set:
                        staff_changed = True
                        # Deactivate active assignments not in the new list
                        instance.assignments.filter(is_active=True).exclude(staff__in=staff_objs).update(is_active=False)
                        
                        # Add / reactivate new staff assignments
                        for s in staff_objs:
                            assign_obj, created = ComplaintAssignment.objects.get_or_create(
                                complaint=instance,
                                staff=s,
                                defaults={'assigned_by': user, 'is_active': True}
                            )
                            if not created and not assign_obj.is_active:
                                assign_obj.is_active = True
                                assign_obj.assigned_by = user
                                assign_obj.save()
                            
                            # Notify staff member
                            Notification.objects.create(
                                user=s.user,
                                title="New Complaint Assigned",
                                message=f"You have been assigned to Complaint #{instance.id} ({instance.category}).",
                                complaint=instance
                            )
                    
                    instance.assigned_staff = staff_objs[0] if staff_objs else None

                # Keep status as Pending until a staff member explicitly starts work!
                # Do NOT transition to In Progress automatically upon assignment.
                instance.save()

        old_status = instance.status
        old_department = instance.department
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        instance.refresh_from_db()
        remarks = request.data.get('remarks', '')
        if isinstance(remarks, str):
            remarks = remarks.strip()

        status_changed = (old_status != instance.status)
        is_assignment_action = dept_changed or staff_changed or (remarks and 'assigned' in remarks.lower())

        if status_changed or dept_changed or staff_changed or remarks:
            if not remarks:
                if dept_changed or staff_changed:
                    staff_cnt = instance.assignments.filter(is_active=True).count()
                    remarks = f"Assigned to {instance.department.name if instance.department else 'Department'} with {staff_cnt} staff member(s)."
                elif status_changed and instance.status == 'In Progress' and role == 'DEPARTMENT_STAFF':
                    remarks = f"Work started by {user.get_full_name() or user.email}."
                else:
                    remarks = f"Status changed to {instance.status}"

            hist_status = instance.status

            # Avoid duplicate history records from repeated clicks/retries
            latest_h = instance.status_history.order_by('-updated_at', '-id').first()
            is_duplicate = (
                latest_h and 
                latest_h.status == hist_status and 
                (latest_h.remarks or '').strip() == remarks and 
                latest_h.updated_by == user
            )

            if not is_duplicate:
                ComplaintStatusHistory.objects.create(
                    complaint=instance,
                    status=hist_status,
                    remarks=remarks,
                    updated_by=user
                )

                # If staff started work, notify citizen
                if status_changed and instance.status == 'In Progress' and role == 'DEPARTMENT_STAFF':
                    Notification.objects.create(
                        user=instance.citizen,
                        title=f"Work Started on Complaint #{instance.id}",
                        message=f"Department staff ({user.get_full_name() or user.email}) has started working on your complaint.",
                        complaint=instance
                    )

        return Response(ComplaintSerializer(instance).data)


class ComplaintRejectView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = getattr(getattr(user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return Response({"error": "Only Municipal Authority can reject complaints."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            try:
                complaint = Complaint.objects.select_for_update().get(pk=pk)
            except Complaint.DoesNotExist:
                return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

            # Rule: Only while the complaint is Pending
            if complaint.status != 'Pending':
                return Response({"error": "Complaints can only be rejected while in Pending status."}, status=status.HTTP_400_BAD_REQUEST)

            # Rule: Only before it has been assigned to a department or staff
            if complaint.department is not None or complaint.assignments.filter(is_active=True).exists():
                return Response({"error": "Complaints that have already been assigned to a department or staff cannot be rejected."}, status=status.HTTP_400_BAD_REQUEST)

            rejection_reason = request.data.get('rejection_reason', '').strip() or request.data.get('reason', '').strip()
            if not rejection_reason:
                return Response({"error": "A rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

            complaint.status = 'Rejected'
            complaint.rejection_reason = rejection_reason
            complaint.rejected_by = user
            complaint.rejected_at = timezone.now()
            complaint.save()

            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                status='Rejected',
                remarks=f"Rejection reason: {rejection_reason}",
                updated_by=user
            )

            # Notify the citizen
            Notification.objects.create(
                user=complaint.citizen,
                title=f"Complaint #{complaint.id} Rejected",
                message=f"Your complaint regarding {complaint.category} was rejected by Municipal Authority. Reason: {rejection_reason}",
                complaint=complaint
            )

        serializer = ComplaintSerializer(complaint)
        return Response({
            "message": "Complaint rejected successfully.",
            "complaint": serializer.data
        }, status=status.HTTP_200_OK)


class ComplaintStartWorkView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = getattr(getattr(user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'DEPARTMENT_STAFF':
            return Response({"error": "Only Department Staff can start work on complaints."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            try:
                complaint = Complaint.objects.select_for_update().get(pk=pk)
            except Complaint.DoesNotExist:
                return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

            # Check department and assignment permissions
            staff_dept = getattr(getattr(user, 'departmentstaff', None), 'department', None)
            if complaint.department != staff_dept:
                return Response({"error": "You do not have permission to update complaints from another department."}, status=status.HTTP_403_FORBIDDEN)

            has_assignments = complaint.assignments.filter(is_active=True).exists() or bool(complaint.assigned_staff)
            is_assigned_to_user = complaint.assignments.filter(staff__user=user, is_active=True).exists()
            if not is_assigned_to_user and complaint.assigned_staff and complaint.assigned_staff.user_id == user.id:
                is_assigned_to_user = True

            if not has_assignments:
                return Response({
                    "error": "This complaint is unassigned (Assigned Team is None). Work can only be started once a Municipal Authority assigns it to you."
                }, status=status.HTTP_403_FORBIDDEN)

            if not is_assigned_to_user:
                return Response({
                    "error": "You are not assigned to this complaint. Work can only be started by the assigned staff member."
                }, status=status.HTTP_403_FORBIDDEN)

            if complaint.status == 'Resolved':
                return Response({"error": "This complaint is already resolved."}, status=status.HTTP_400_BAD_REQUEST)
            if complaint.status == 'Rejected':
                return Response({"error": "This complaint has been rejected."}, status=status.HTTP_400_BAD_REQUEST)
            if complaint.status == 'Awaiting Citizen Confirmation':
                return Response({"error": "This complaint is awaiting citizen confirmation."}, status=status.HTTP_400_BAD_REQUEST)

            if complaint.status == 'Pending':
                complaint.status = 'In Progress'
                complaint.save()

                staff_name = user.get_full_name() or user.email
                ComplaintStatusHistory.objects.create(
                    complaint=complaint,
                    status='In Progress',
                    remarks=f"Work started by {staff_name}.",
                    updated_by=user
                )

                Notification.objects.create(
                    user=complaint.citizen,
                    title=f"Work Started on Complaint #{complaint.id}",
                    message=f"Department staff ({staff_name}) has started working on your complaint.",
                    complaint=complaint
                )

        serializer = ComplaintSerializer(complaint, context={'request': request})
        return Response({
            "message": "Work started on complaint.",
            "complaint": serializer.data
        }, status=status.HTTP_200_OK)


class ComplaintCompleteView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        user = request.user
        role = getattr(getattr(user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'DEPARTMENT_STAFF':
            return Response({"error": "Only Department Staff can mark work as completed."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check department and assignment permissions
        staff_dept = getattr(getattr(user, 'departmentstaff', None), 'department', None)
        if complaint.department != staff_dept:
            return Response({"error": "You do not have permission to update complaints from another department."}, status=status.HTTP_403_FORBIDDEN)
        
        has_any_assignments = complaint.assignments.filter(is_active=True).exists() or bool(complaint.assigned_staff)
        assigned_to_complaint = complaint.assignments.filter(staff__user=user, is_active=True).exists()
        if not assigned_to_complaint and complaint.assigned_staff and complaint.assigned_staff.user_id == user.id:
            assigned_to_complaint = True

        if has_any_assignments and not assigned_to_complaint:
            return Response({"error": "You are not assigned to this complaint."}, status=status.HTTP_403_FORBIDDEN)

        if complaint.status == 'Resolved':
            return Response({"error": "This complaint is already resolved."}, status=status.HTTP_400_BAD_REQUEST)

        if complaint.status in ['Awaiting Authority Verification', 'Awaiting Citizen Confirmation']:
            return Response({"error": "This complaint is already awaiting authority verification (already awaiting citizen confirmation)."}, status=status.HTTP_400_BAD_REQUEST)

        if complaint.status not in ['Pending', 'In Progress']:
            return Response({"error": "Work completion can only be submitted for Pending or In Progress complaints."}, status=status.HTTP_400_BAD_REQUEST)

        completion_remarks = request.data.get('completion_remarks', '').strip()
        if not completion_remarks:
            return Response({"error": "Completion remarks are required."}, status=status.HTTP_400_BAD_REQUEST)

        completion_image = request.FILES.get('completion_image') or request.FILES.get('completion_photo') or request.FILES.get('image')
        # Check completion photo: required in multipart uploads and explicit photo validation
        is_multipart = request.content_type and 'multipart' in request.content_type
        if not completion_image and (is_multipart or request.data.get('require_photo') or not (request.content_type and 'application/json' in request.content_type)):
            return Response({"error": "A completion photo is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            complaint.status = 'Awaiting Authority Verification'
            complaint.save()

            # Create completion record
            completion = ComplaintCompletion.objects.create(
                complaint=complaint,
                submitted_by=user,
                completion_remarks=completion_remarks,
                completion_image=completion_image,
                verification_status='Pending',
                citizen_response='Pending'
            )

            # Record status history
            remarks_text = f"Work completed: {completion_remarks}" if completion_remarks else "Work completed by staff."
            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                status='Awaiting Authority Verification',
                remarks=remarks_text,
                updated_by=user
            )

            # Notify Municipal Authority users
            for auth_prof in UserProfile.objects.filter(role='MUNICIPAL_AUTHORITY').select_related('user'):
                Notification.objects.create(
                    user=auth_prof.user,
                    title=f"Verification Required: Complaint #{complaint.id}",
                    message=f"Department staff ({user.get_full_name() or user.email}) has submitted completion details and a photo for Complaint #{complaint.id} ({complaint.category}). Please verify.",
                    complaint=complaint
                )

            # Notify Citizen
            Notification.objects.create(
                user=complaint.citizen,
                title=f"Work Completed on Complaint #{complaint.id}",
                message="The department staff have reported that work on your complaint has been completed. It is currently awaiting verification by the Municipal Authority.",
                complaint=complaint
            )

        serializer = ComplaintSerializer(complaint)
        return Response({
            "message": "Complaint marked as completed. Awaiting Authority Verification.",
            "complaint": serializer.data
        }, status=status.HTTP_200_OK)


class ComplaintVerifyView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = getattr(getattr(user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return Response(
                {"error": "Only authorized Municipal Authority users can verify complaint completion."},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            try:
                complaint = Complaint.objects.select_for_update().get(pk=pk)
            except Complaint.DoesNotExist:
                return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

            if complaint.status not in ['Awaiting Authority Verification', 'Awaiting Citizen Confirmation']:
                return Response(
                    {"error": f"This complaint is currently '{complaint.status}' and is not awaiting verification."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            action = request.data.get('action')  # 'approve' or 'reject'
            remarks = request.data.get('remarks', '').strip()
            rejection_reason = request.data.get('rejection_reason', '').strip() or remarks

            latest_completion = complaint.completions.first()

            if action in ['approve', 'Resolved', 'confirm', 'yes', 'true']:
                complaint.status = 'Resolved'
                complaint.verified_by = user
                complaint.verified_at = timezone.now()
                complaint.verification_remarks = remarks
                complaint.save()

                if latest_completion:
                    latest_completion.verification_status = 'Approved'
                    latest_completion.verified_by = user
                    latest_completion.verified_at = timezone.now()
                    latest_completion.verification_remarks = remarks
                    latest_completion.citizen_response = 'Confirmed'
                    latest_completion.save()

                hist_remarks = f"Approved and marked as Resolved by Municipal Authority. {remarks}".strip()
                ComplaintStatusHistory.objects.create(
                    complaint=complaint,
                    status='Resolved',
                    remarks=hist_remarks,
                    updated_by=user
                )

                # Notify Citizen about resolution and optional feedback
                Notification.objects.create(
                    user=complaint.citizen,
                    title=f"Complaint #{complaint.id} Resolved",
                    message=f"Municipal Authority has verified and approved the resolution for your complaint ({complaint.category}). You may now provide optional feedback.",
                    complaint=complaint
                )

                # Notify assigned staff members
                active_assignments = complaint.assignments.filter(is_active=True).select_related('staff__user')
                for a in active_assignments:
                    Notification.objects.create(
                        user=a.staff.user,
                        title=f"Complaint #{complaint.id} Approved",
                        message=f"Municipal Authority approved work completion for Complaint #{complaint.id}. Status is now Resolved.",
                        complaint=complaint
                    )

                message = "Complaint approved and marked as Resolved successfully."

            elif action in ['reject', 'return', 'not_fixed', 'no', 'false', 'reopen']:
                if not rejection_reason:
                    return Response(
                        {"error": "A rejection reason is required to reject verification."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                complaint.status = 'In Progress'
                complaint.verification_remarks = rejection_reason
                complaint.save()

                if latest_completion:
                    latest_completion.verification_status = 'Rejected'
                    latest_completion.verified_by = user
                    latest_completion.verified_at = timezone.now()
                    latest_completion.verification_remarks = rejection_reason
                    latest_completion.citizen_response = 'Disputed'
                    latest_completion.save()

                hist_remarks = f"Verification rejected by Municipal Authority. Reason: {rejection_reason}"
                ComplaintStatusHistory.objects.create(
                    complaint=complaint,
                    status='In Progress',
                    remarks=hist_remarks,
                    updated_by=user
                )

                # Notify assigned staff members
                active_assignments = complaint.assignments.filter(is_active=True).select_related('staff__user')
                for a in active_assignments:
                    Notification.objects.create(
                        user=a.staff.user,
                        title=f"Complaint #{complaint.id} Verification Rejected",
                        message=f"Municipal Authority rejected the work verification for Complaint #{complaint.id}. Reason: {rejection_reason}. Status has been returned to In Progress.",
                        complaint=complaint
                    )

                # Notify Citizen
                Notification.objects.create(
                    user=complaint.citizen,
                    title=f"Update on Complaint #{complaint.id}",
                    message=f"Municipal Authority reviewed the work on your complaint and requested rework: {rejection_reason}. Status has returned to In Progress.",
                    complaint=complaint
                )

                message = "Verification rejected. The complaint has been returned to In Progress."

            else:
                return Response(
                    {"error": "Invalid action. Must be 'approve' or 'reject'."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = ComplaintSerializer(complaint)
        return Response({
            "message": message,
            "complaint": serializer.data
        }, status=status.HTTP_200_OK)


class ComplaintFeedbackView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(complaint, 'feedback') or not complaint.feedback:
            return Response({"feedback": None}, status=status.HTTP_200_OK)

        return Response({"feedback": ComplaintFeedbackSerializer(complaint.feedback).data}, status=status.HTTP_200_OK)

    def post(self, request, pk):
        user = request.user
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        # Allow only the citizen who submitted the complaint to provide feedback for that complaint
        if complaint.citizen != user:
            return Response(
                {"error": "Only the citizen who submitted this complaint can provide feedback."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Once a complaint becomes Resolved, allow citizen feedback
        if complaint.status != 'Resolved':
            return Response(
                {"error": "Feedback can only be provided for resolved complaints."},
                status=status.HTTP_400_BAD_REQUEST
            )

        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        if isinstance(comment, str):
            comment = comment.strip()
        else:
            comment = ''

        # Validate rating if provided
        if rating is not None and rating != '':
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    return Response({"error": "Rating must be between 1 and 5 stars."}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({"error": "Rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            rating = None

        # Prevent duplicate feedback submissions for the same complaint; update existing if already submitted
        feedback, created = ComplaintFeedback.objects.update_or_create(
            complaint=complaint,
            defaults={
                'citizen': user,
                'rating': rating,
                'comment': comment if comment else None
            }
        )

        return Response({
            "message": "Feedback submitted successfully." if created else "Feedback updated successfully.",
            "feedback": ComplaintFeedbackSerializer(feedback).data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ComplaintCitizenConfirmView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        return Response(
            {"error": "The Municipal Authority has sole responsibility for verifying completed work and approving the final resolution. Citizens can track the complaint status and submit rating and feedback after resolution."},
            status=status.HTTP_403_FORBIDDEN
        )


class NotificationListView(generics.ListAPIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')[:50]


class NotificationMarkReadView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        if pk:
            Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
        else:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "Notifications marked as read."})


class NotificationUnreadCountView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})


class AnalyticsView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(getattr(request.user, 'userprofile', None), 'role', 'CITIZEN')
        if role != 'MUNICIPAL_AUTHORITY':
            return Response(
                {"error": "Only authorized Municipal Authority users can access analytics."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 1. Complaints by Status (Bar Chart)
        # Display the total number of complaints for each status:
        # - Pending
        # - In Progress
        # - Awaiting Citizen Confirmation
        # - Resolved
        # - Rejected
        status_categories = [
            'Pending',
            'In Progress',
            'Awaiting Authority Verification',
            'Awaiting Citizen Confirmation',
            'Resolved',
            'Rejected'
        ]
        status_map = {s: 0 for s in status_categories}
        for item in Complaint.objects.values('status').annotate(count=Count('id')):
            st = item['status']
            if st in status_map:
                status_map[st] = item['count']
            else:
                status_map[st] = item['count']

        by_status = [
            {"status": s, "count": status_map.get(s, 0)}
            for s in status_categories
        ]

        # 2. Daily Complaints Trend (Bar Chart)
        # Display the number of newly submitted complaints for each date.
        # Include Last 7 Days and Last 30 Days filters.
        # Use the complaint creation date to calculate daily counts.
        days_param = request.query_params.get('days', '7')
        try:
            days = int(days_param)
            if days not in [7, 30]:
                days = 7 if days < 15 else 30
        except (ValueError, TypeError):
            days = 7

        today = timezone.localdate() if hasattr(timezone, 'localdate') else timezone.now().date()

        start_date_30 = today - timedelta(days=29)
        start_date_7 = today - timedelta(days=6)

        daily_qs = (
            Complaint.objects.filter(
                created_at__date__gte=start_date_30,
                created_at__date__lte=today
            )
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        daily_map = {item['date']: item['count'] for item in daily_qs}

        daily_trend_7 = [
            {
                "date": (start_date_7 + timedelta(days=i)).strftime('%Y-%m-%d'),
                "formatted_date": (start_date_7 + timedelta(days=i)).strftime('%b %d'),
                "count": daily_map.get(start_date_7 + timedelta(days=i), 0)
            }
            for i in range(7)
        ]

        daily_trend_30 = [
            {
                "date": (start_date_30 + timedelta(days=i)).strftime('%Y-%m-%d'),
                "formatted_date": (start_date_30 + timedelta(days=i)).strftime('%b %d'),
                "count": daily_map.get(start_date_30 + timedelta(days=i), 0)
            }
            for i in range(30)
        ]

        selected_trend = daily_trend_30 if days == 30 else daily_trend_7

        # 3. Department-wise Complaints (Bar Chart)
        # Display number of complaints assigned to each department based on the departments that actually exist in the database.
        # Real department names and complaint counts from PostgreSQL.
        # Count complaints according to their assigned department.
        depts_qs = (
            Department.objects
            .annotate(complaint_count=Count('complaints'))
            .order_by('-complaint_count', 'name')
        )
        by_department = [
            {
                "id": dept.id,
                "name": dept.name,
                "count": dept.complaint_count
            }
            for dept in depts_qs
        ]

        return Response({
            "by_status": by_status,
            "daily_trend": selected_trend,
            "trend_days": days,
            "daily_trend_7": daily_trend_7,
            "daily_trend_30": daily_trend_30,
            "by_department": by_department,
            "total_complaints": Complaint.objects.count()
        }, status=status.HTTP_200_OK)


