import os

from django.conf import settings

from api.services.rag.pipeline import process_document_upload
from database.models import ChatMessage, Chunk, Conversation, Document, DocumentStatus
from database.serializers import DocumentSerializer


ALLOWED_EXTENSIONS = {".pdf": "pdf", ".txt": "txt"}


def get_user_id(request):
    return request.user.user_doc.id_str


def list_documents(user_id: str) -> list:
    documents = Document.objects(user_id=user_id).order_by("-uploaded_at")
    serializer = DocumentSerializer()
    return [serializer.to_representation(doc) for doc in documents]


def get_document_for_user(document_id: str, user_id: str) -> Document | None:
    return Document.objects(id=document_id, user_id=user_id).first()


def validate_upload_file(uploaded_file) -> tuple[str, str]:
    if uploaded_file.size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise ValueError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    ext = os.path.splitext(uploaded_file.name)[1].lower()
    file_type = ALLOWED_EXTENSIONS.get(ext)
    if not file_type:
        raise ValueError("Only PDF and TXT files are allowed")

    return uploaded_file.name, file_type


def upload_document(user_id: str, uploaded_file) -> dict:
    filename, file_type = validate_upload_file(uploaded_file)
    file_bytes = uploaded_file.read()

    document = Document(
        user_id=user_id,
        filename=filename,
        file_type=file_type,
        status=DocumentStatus.PROCESSING,
    )
    document.save()

    try:
        process_document_upload(document, file_bytes)
    except Exception:
        document.reload()
        if document.status == DocumentStatus.FAILED:
            return DocumentSerializer().to_representation(document)
        raise

    document.reload()
    return DocumentSerializer().to_representation(document)


def delete_document(document_id: str, user_id: str) -> bool:
    document = get_document_for_user(document_id, user_id)
    if not document:
        return False

    Chunk.objects(document_id=document_id, user_id=user_id).delete()
    ChatMessage.objects(document_id=document_id, user_id=user_id).delete()
    Conversation.objects(document_id=document_id, user_id=user_id).delete()
    document.delete()
    return True
