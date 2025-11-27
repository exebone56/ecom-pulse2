from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("product.urls")),
    path("api/", include("order.urls")),
    path("api/", include("stock.urls")),
    path('api/', include('document.urls')),
    path('api/', include('warehouse.urls')),
    path('api/', include('api.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
