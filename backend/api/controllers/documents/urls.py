from django.urls import path

from api.controllers.documents import views

urlpatterns = [
    path("", views.document_list_create, name="document-list-create"),
    path("<str:document_id>/", views.document_delete, name="document-delete"),
]
