from django.urls import include, path

urlpatterns = [
    path("auth/", include("api.controllers.auth.urls")),
    path("documents/", include("api.controllers.documents.urls")),
    path("documents/", include("api.controllers.chat.urls")),
]
