import os

from rest_framework import serializers
from django.contrib.auth import authenticate

from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'birth_date', 'position', 'department', 'phone_number', 
                 'employment_date', 'avatar', 'avatar_url')
        read_only_fields = ('id',)

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = CustomUser.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
                
                if not user:
                    raise serializers.ValidationError('Неверные учетные данные')
                
                if not user.is_active:
                    raise serializers.ValidationError('Аккаунт неактивен')
                    
                attrs['user'] = user
                return attrs
                
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('Пользователь с таким email не найден')
        else:
            raise serializers.ValidationError('Email и пароль обязательны')

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'birth_date', 'phone_number')

class AvatarUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=True)

    class Meta:
        model = CustomUser
        fields = ('avatar',)

    def validate_avatar(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Размер файла не должен превышать 5MB")
        
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        extension = os.path.splitext(value.name)[1].lower()
        if extension not in valid_extensions:
            raise serializers.ValidationError("Поддерживаются только JPG, PNG и GIF файлы")
        
        return value

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Новые пароли не совпадают")
        
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError("Новый пароль должен отличаться от старого")
        
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Текущий пароль неверен")
        return value

class EmployeeRegistrationSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'password1', 'password2',
            'first_name', 'last_name', 'role', 'department',
            'phone_number', 'birth_date', 'employment_date'
        )
        read_only_fields = ('id',)
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'position': {'required': False, 'allow_blank': True},
            'department': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'birth_date': {'required': False},
            'employment_date': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают!"})

        if len(attrs['password1']) < 8:
            raise serializers.ValidationError({"password": "Пароль должен быть не менее 8 символов!"})

        # Проверка уникальности
        if CustomUser.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError({"email": "Пользователь с таким email уже существует."})

        if CustomUser.objects.filter(username=attrs.get('username')).exists():
            raise serializers.ValidationError({"username": "Пользователь с таким логином уже существует."})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")

        return CustomUser.objects.create_user(
            password=password, 
            **validated_data
        )

class EmployeeListSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    role_name = serializers.SerializerMethodField()
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'role_name', 'department', 'phone_number',
            'employment_date', 'avatar_url', 'is_active'
        )

    def get_role_name(self, obj):
        return obj.get_role_display()

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}"