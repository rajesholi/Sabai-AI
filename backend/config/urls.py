from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


from accounts.api import test_api


def home(request):
    return JsonResponse(
        {
            "message": "AI Sabai backend is running",
            "endpoints": {
                "admin": "/admin/",
                "login": "/api/login/",
                "register": "/api/register/",
                "test": "/api/test/",
            },
        }
    )


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/test/", test_api, name="test-api"),
    path("api/", include("accounts.urls")),
]
