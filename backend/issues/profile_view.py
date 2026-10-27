from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .views import CsrfExemptSessionAuthentication

class ProfileView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            role = user.userprofile.role
        except:
            role = 'CITIZEN'
        department_name = None
        staff_id = None
        if role == 'DEPARTMENT_STAFF':
            try:
                department_name = user.departmentstaff.department.name
                staff_id = user.departmentstaff.id
            except:
                pass

        full_name = user.get_full_name().strip() if user.get_full_name() else ""
        if not full_name:
            full_name = user.first_name.strip() if user.first_name else ""
        if not full_name:
            full_name = user.username.strip() if user.username and '@' not in user.username else ""
        if not full_name:
            full_name = user.email.strip() if user.email else ""

        return Response({
            "id": user.id,
            "user_id": user.id,
            "staff_id": staff_id,
            "email": user.email,
            "full_name": full_name,
            "first_name": user.first_name,
            "username": user.username,
            "role": role,
            "department": department_name
        })

    def patch(self, request):
        user = request.user
        email = request.data.get('email')
        full_name = request.data.get('full_name')

        if email:
            # Check if email is already taken by another user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({"error": "Email is already in use by another account."}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email
            user.username = email # Assuming username is same as email
        
        if full_name:
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            if len(name_parts) > 1:
                user.last_name = name_parts[1]
            else:
                user.last_name = ''
                
        user.save()

        try:
            role = user.userprofile.role
        except:
            role = 'CITIZEN'

        department_name = None
        if role == 'DEPARTMENT_STAFF':
            try:
                department_name = user.departmentstaff.department.name
            except:
                pass

        return Response({
            "email": user.email,
            "full_name": user.get_full_name() or user.email,
            "role": role,
            "department": department_name,
            "message": "Profile updated successfully."
        })
