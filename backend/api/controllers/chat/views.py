from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.controllers.chat import services
from api.controllers.documents.services import get_user_id
from database.serializers import ChatQuestionSerializer, CreateConversationSerializer


@api_view(["GET", "POST"])
def conversation_list_create(request, document_id):
    user_id = get_user_id(request)

    if request.method == "GET":
        conversations = services.list_conversations(document_id, user_id)
        if conversations is None:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(conversations)

    serializer = CreateConversationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    conversation = services.create_conversation(
        document_id=document_id,
        user_id=user_id,
        title=serializer.validated_data.get("title", ""),
    )
    if conversation is None:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response(conversation, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
def conversation_delete(request, document_id, conversation_id):
    user_id = get_user_id(request)
    deleted = services.delete_conversation(conversation_id, document_id, user_id)
    if not deleted:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def conversation_messages(request, document_id, conversation_id):
    user_id = get_user_id(request)
    messages = services.get_conversation_messages(conversation_id, document_id, user_id)
    if messages is None:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(messages)


@api_view(["POST"])
def conversation_chat(request, document_id, conversation_id):
    user_id = get_user_id(request)
    serializer = ChatQuestionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = services.ask_question(
            document_id=document_id,
            conversation_id=conversation_id,
            user_id=user_id,
            question=serializer.validated_data["question"],
        )
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except RuntimeError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    if result is None:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response(result)
