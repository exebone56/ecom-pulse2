from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import gettext_lazy as _
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = (
            'email', 'username', 'first_name', 'last_name',
            'position', 'department', 'phone_number', 'employment_date'
        )
        labels = {
            'email': _('Email'),
            'username': _('Имя пользователя'),
            'first_name': _('Имя'),
            'last_name': _('Фамилия'),
            'position': _('Должность'),
            'department': _('Подразделение'),
            'phone_number': _('Номер телефона'),
            'employment_date': _('Дата трудоустройства'),
        }
        widgets = {
            'employment_date': forms.DateInput(attrs={'type': 'date'}),
            'birth_date': forms.DateInput(attrs={'type': 'date'}),
        }

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = CustomUser
        fields = (
            'email', 'username', 'first_name', 'last_name',
            'birth_date', 'role', 'department', 'phone_number', 
            'employment_date', 'avatar', 'is_active', 'is_staff', 'is_superuser',
            'groups', 'user_permissions'
        )
        labels = {
            'email': _('Email'),
            'username': _('Имя пользователя'),
            'first_name': _('Имя'),
            'last_name': _('Фамилия'),
            'birth_date': _('Дата рождения'),
            'role': _('Должность'),
            'department': _('Подразделение'),
            'phone_number': _('Номер телефона'),
            'employment_date': _('Дата трудоустройства'),
            'avatar': _('Аватарка'),
        }
        widgets = {
            'employment_date': forms.DateInput(attrs={'type': 'date'}),
            'birth_date': forms.DateInput(attrs={'type': 'date'}),
        }