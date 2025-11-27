from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import date
import os

def user_avatar_path(instance, filename):
    return f"avatars/user_{instance.id}/{filename}"

class CustomUser(AbstractUser):
    
    class Role(models.TextChoices):
        DIRECTOR = 'DIRECTOR', 'Руководитель'
        SENIOR_MANAGER = 'SENIOR_MANAGER', 'Старший менеджер'
        MANAGER = 'MANAGER', 'Менеджер'
        WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER', 'Заведующий складом'
        WAREHOUSE_WORKER = 'WAREHOUSE_WORKER', 'Работник склада'
        ORDER_PICKER = 'ORDER_PICKER', 'Сборщик заказов'

    email = models.EmailField(unique=True, verbose_name="Email")
    first_name = models.CharField(max_length=30, verbose_name='Имя')
    last_name = models.CharField(max_length=30, verbose_name='Фамилия')
    birth_date = models.DateField(verbose_name='Дата рождения', null=True, blank=True)
    position = models.CharField(max_length=100, verbose_name='Должность')
    department = models.CharField(max_length=100, verbose_name='Подразделение')
    phone_number = models.CharField(max_length=20, verbose_name='Номер телефона')
    employment_date = models.DateField(verbose_name='Дата трудоустройства', default=date.today)

    avatar = models.ImageField(
        upload_to=user_avatar_path,
        verbose_name="Аватарка",
        null=True,
        blank=True,
        default="avatars/default_avatar.png"
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MANAGER,
        verbose_name='Роль в системе'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def is_director(self):
        return self.role == self.Role.DIRECTOR
    
    def is_senior_manager(self):
        return self.role == self.Role.SENIOR_MANAGER
    
    def is_manager(self):
        return self.role == self.Role.MANAGER
    
    def is_warehouse_manager(self):
        return self.role == self.Role.WAREHOUSE_MANAGER
    
    def is_warehouse_worker(self):
        return self.role == self.Role.WAREHOUSE_WORKER
    
    def is_order_picker(self):
        return self.role == self.Role.ORDER_PICKER
    
    def can_manage_employees(self):
        """Кто может управлять сотрудниками"""
        return self.role in [self.Role.DIRECTOR, self.Role.SENIOR_MANAGER]
    
    def can_delete_employees(self):
        """Кто может удалять сотрудников"""
        return self.role == self.Role.DIRECTOR

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.position})"
    
    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_avatar = CustomUser.objects.get(pk=self.pk).avatar
                if old_avatar and old_avatar != self.avatar:
                    if os.path.isfile(old_avatar.path):
                        if f"user_{self.pk}" in old_avatar.path:
                            os.remove(old_avatar.path)
                        pass
            except CustomUser.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.avatar:
            if os.path.isfile(self.avatar.path):
                os.remove(self.avatar.path)
        super().delete(*args, **kwargs)


