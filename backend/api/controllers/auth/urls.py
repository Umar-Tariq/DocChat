from django.urls import path

from api.controllers.auth import views

urlpatterns = [
    path("register/", views.register, name="auth-register"),
    path("login/", views.login, name="auth-login"),
    path("refresh/", views.refresh, name="auth-refresh"),
    path("logout/", views.logout, name="auth-logout"),
]
