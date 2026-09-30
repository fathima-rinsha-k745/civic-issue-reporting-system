from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, 
    ComplaintListCreateView, ComplaintDetailView, 
    DepartmentListCreateView, DepartmentDetailView,
    StaffListCreateView, StaffDetailView
)
from .profile_view import ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('complaints/', ComplaintListCreateView.as_view(), name='complaints-list'),
    path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaints-detail'),
    path('departments/', DepartmentListCreateView.as_view(), name='departments-list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='departments-detail'),
    path('staff/', StaffListCreateView.as_view(), name='staff-list'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
]
