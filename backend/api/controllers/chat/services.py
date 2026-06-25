from api.controllers.documents.services import get_document_for_user
from api.services.rag.pipeline import answer_question
from database.models import ChatMessage, Conversation
from database.serializers import ChatMessageSerializer, ConversationSerializer


def _get_conversation(conversation_id: str, document_id: str, user_id: str) -> Conversation | None:
    return Conversation.objects(
        id=conversation_id,
        document_id=document_id,
        user_id=user_id,
    ).first()


def list_conversations(document_id: str, user_id: str) -> list | None:
    document = get_document_for_user(document_id, user_id)
    if not document:
        return None

    conversations = Conversation.objects(document_id=document_id, user_id=user_id).order_by(
        "-updated_at"
    )
    serializer = ConversationSerializer()
    result = []

    for conversation in conversations:
        has_messages = ChatMessage.objects(
            conversation_id=conversation.id_str,
            user_id=user_id,
        ).first()
        if has_messages:
            result.append(serializer.to_representation(conversation))
        else:
            conversation.delete()

    return result


def create_conversation(document_id: str, user_id: str, title: str = "") -> dict | None:
    document = get_document_for_user(document_id, user_id)
    if not document:
        return None

    conversation = Conversation(
        user_id=user_id,
        document_id=document_id,
        title=title.strip() or "New Chat",
    )
    conversation.save()
    return ConversationSerializer().to_representation(conversation)


def delete_conversation(conversation_id: str, document_id: str, user_id: str) -> bool:
    conversation = _get_conversation(conversation_id, document_id, user_id)
    if not conversation:
        return False

    ChatMessage.objects(conversation_id=conversation_id, user_id=user_id).delete()
    conversation.delete()
    return True


def get_conversation_messages(
    conversation_id: str,
    document_id: str,
    user_id: str,
) -> list | None:
    conversation = _get_conversation(conversation_id, document_id, user_id)
    if not conversation:
        return None

    messages = ChatMessage.objects(conversation_id=conversation_id, user_id=user_id).order_by(
        "created_at"
    )
    serializer = ChatMessageSerializer()
    return [serializer.to_representation(msg) for msg in messages]


def _build_history(conversation_id: str, user_id: str) -> list[dict]:
    messages = ChatMessage.objects(conversation_id=conversation_id, user_id=user_id).order_by(
        "created_at"
    )
    return [{"role": msg.role, "content": msg.content} for msg in messages]


def _set_conversation_title(conversation: Conversation, question: str) -> None:
    conversation.title = question.strip()[:80] or "New Chat"
    conversation.save()


def ask_question(
    document_id: str,
    conversation_id: str,
    user_id: str,
    question: str,
) -> dict | None:
    document = get_document_for_user(document_id, user_id)
    if not document:
        return None

    conversation = _get_conversation(conversation_id, document_id, user_id)
    if not conversation:
        return None

    history = _build_history(conversation_id, user_id)

    user_message = ChatMessage(
        user_id=user_id,
        document_id=document_id,
        conversation_id=conversation_id,
        role="user",
        content=question,
    )
    user_message.save()
    _set_conversation_title(conversation, question)

    try:
        result = answer_question(question, document, history)
    except ValueError as exc:
        raise ValueError(str(exc)) from exc
    except Exception as exc:
        raise RuntimeError("Failed to generate answer. Please try again.") from exc

    assistant_message = ChatMessage(
        user_id=user_id,
        document_id=document_id,
        conversation_id=conversation_id,
        role="assistant",
        content=result["answer"],
        citations=result["citations"],
    )
    assistant_message.save()
    conversation.touch()

    return {
        "answer": result["answer"],
        "citations": result["citations"],
        "route": result.get("route"),
        "conversation_id": conversation_id,
        "message": ChatMessageSerializer().to_representation(assistant_message),
    }
