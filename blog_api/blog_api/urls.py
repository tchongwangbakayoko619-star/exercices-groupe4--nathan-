from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import articles.admin  # ensure admin registrations are imported
import comments.admin
from articles.models import Article
from comments.models import Comment
from django.contrib import admin as _admin

# Ensure models are registered in admin at startup
if Article not in _admin.site._registry:
    _admin.site.register(Article)
if Comment not in _admin.site._registry:
    _admin.site.register(Comment)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('articles.urls')),
    path('api/', include('comments.urls')),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('api/auth/login/refresh/', TokenRefreshView.as_view(), name='login-refresh'),
]
