from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("login/", UserLoginAPIView.as_view(), name="login-user"),
    path("logout/", UserLogoutAPIView.as_view(), name="logout-user"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path('user-info/', UserInfoAPIView.as_view(), name='user-info'),
    path('update-profile/', UserUpdateAPIView.as_view(), name='update-profile'),
    path('update-avatar/', AvatarUpdateAPIView.as_view(), name='update-avatar'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='change-password'),
     path('employees/register/', EmployeeRegistrationAPIView.as_view(), name='employee-register'),
    path('employees/', EmployeeListAPIView.as_view(), name='employee-list'),
    path('employees/<int:pk>/delete/', EmployeeDeleteAPIView.as_view(), name='employee-delete'),
    path('employees/<int:pk>/activate/', EmployeeActivateAPIView.as_view(), name='employee-activate'),
    path('emoloyees/roles/', RoleListView.as_view(), name='role-list'),
]