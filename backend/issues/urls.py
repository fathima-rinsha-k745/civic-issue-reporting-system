from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, 
    ComplaintListCreateView, ComplaintDetailView, 
    DepartmentListCreateView, DepartmentDetailView,
    StaffListCreateView, StaffDetailView,
    ComplaintCompleteView, ComplaintCitizenConfirmView,
    ComplaintVerifyView, ComplaintFeedbackView,
    ComplaintRejectView, ComplaintStartWorkView,
    NotificationListView, NotificationMarkReadView, NotificationUnreadCountView,
    AnalyticsView
)
from .profile_view import ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('complaints/', ComplaintListCreateView.as_view(), name='complaints-list'),
    path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaints-detail'),
    path('complaints/<int:pk>/reject/', ComplaintRejectView.as_view(), name='complaints-reject'),
    path('complaints/<int:pk>/start-work/', ComplaintStartWorkView.as_view(), name='complaints-start-work'),
    path('complaints/<int:pk>/complete/', ComplaintCompleteView.as_view(), name='complaints-complete'),
    path('complaints/<int:pk>/verify/', ComplaintVerifyView.as_view(), name='complaints-verify'),
    path('complaints/<int:pk>/feedback/', ComplaintFeedbackView.as_view(), name='complaints-feedback'),
    path('complaints/<int:pk>/citizen-confirm/', ComplaintCitizenConfirmView.as_view(), name='complaints-citizen-confirm'),
    path('departments/', DepartmentListCreateView.as_view(), name='departments-list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='departments-detail'),
    path('staff/', StaffListCreateView.as_view(), name='staff-list'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notifications-mark-read'),
    path('notifications/read-all/', NotificationMarkReadView.as_view(), name='notifications-mark-all-read'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notifications-unread-count'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
