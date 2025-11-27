from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Кастомный бэкенд аутентификации, который позволяет входить 
    по email или username
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        
        try:
            user = UserModel.objects.get(
                Q(email=username) | Q(username=username)
            )
        except UserModel.DoesNotExist:
            return None
        except UserModel.MultipleObjectsReturned:
            user = UserModel.objects.filter(
                Q(email=username) | Q(username=username)
            ).first()
        
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def user_can_authenticate(self, user):
        """
        Проверяем, может ли пользователь аутентифицироваться
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None