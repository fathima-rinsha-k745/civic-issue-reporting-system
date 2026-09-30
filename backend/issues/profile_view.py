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
        return Response({
            "email": user.email,
            "full_name": user.get_full_name() or user.email,
            "role": role
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

        return Response({
            "email": user.email,
            "full_name": user.get_full_name() or user.email,
            "role": role,
            "message": "Profile updated successfully."
        })
