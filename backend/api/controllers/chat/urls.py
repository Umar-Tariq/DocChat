from django.urls import path

from api.controllers.chat import views

urlpatterns = [
    path("<str:document_id>/conversations/", views.conversation_list_create, name="conversation-list-create"),
    path(
        "<str:document_id>/conversations/<str:conversation_id>/",
        views.conversation_delete,
        name="conversation-delete",
    ),
    path(
        "<str:document_id>/conversations/<str:conversation_id>/messages/",
        views.conversation_messages,
        name="conversation-messages",
    ),
    path(
        "<str:document_id>/conversations/<str:conversation_id>/chat/",
        views.conversation_chat,
        name="conversation-chat",
    ),
]
