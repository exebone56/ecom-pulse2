from rest_framework.generics import GenericAPIView, RetrieveAPIView, ListAPIView, DestroyAPIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework import permissions
from .models import CustomUser

class UserLoginAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
        
            if not email or not password:
                return Response(
                    {'error': 'Email и пароль обязательны'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'Пользователь с таким email не найден'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            authenticated_user = authenticate(username=user.username, password=password)
            
            if not authenticated_user:
                return Response(
                    {'error': 'Неверный пароль'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            refresh = RefreshToken.for_user(authenticated_user)
            
            user_data = UserSerializer(authenticated_user, context={'request': request}).data
            
            response_data = {
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Внутренняя ошибка сервера'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserLogoutAPIView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status= status.HTTP_400_BAD_REQUEST)

class UserInfoAPIView(RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Передаем request в сериализатор
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)

from rest_framework.generics import UpdateAPIView
from rest_framework.parsers import MultiPartParser, FormParser

class UserUpdateAPIView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserUpdateSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        self.perform_update(serializer)

        user_data = UserSerializer(instance, context={'request': request}).data
        return Response(user_data, status=status.HTTP_200_OK)

class AvatarUpdateAPIView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AvatarUpdateSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Файл аватара обязателен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if instance.avatar:
            instance.avatar.delete(save=False)
        
        self.perform_update(serializer)
        
        user_data = UserSerializer(instance, context={'request': request}).data
        return Response(user_data, status=status.HTTP_200_OK)

class ChangePasswordAPIView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
        
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        return Response(
            {"detail": "Пароль успешно изменен"}, 
            status=status.HTTP_200_OK
        )

class EmployeeRegistrationAPIView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EmployeeRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        user_data = UserSerializer(user, context={'request': request}).data
        return Response(user_data, status=status.HTTP_201_CREATED)

class EmployeeListAPIView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EmployeeListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    filterset_fields = ['department', 'role', 'is_active']  # ← Добавили is_active
    search_fields = ['first_name', 'last_name', 'email', 'role', 'department']
    ordering_fields = ['last_name', 'first_name', 'employment_date', 'department']
    ordering = ['last_name', 'first_name']

    def get_queryset(self):
        show_inactive = self.request.query_params.get('show_inactive', 'false').lower() == 'true'
        
        if show_inactive:
            return CustomUser.objects.all()
        else:
            return CustomUser.objects.filter(is_active=True)

class EmployeeActivateAPIView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = True
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class EmployeeDeleteAPIView(DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

class RoleListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Получить список всех доступных ролей"""
        roles = [
            {
                'value': role[0],
                'label': role[1]
            }
            for role in CustomUser.Role.choices
        ]
        return Response(roles)