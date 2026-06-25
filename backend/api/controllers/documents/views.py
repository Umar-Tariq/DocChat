from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from api.controllers.documents import services
from database.serializers import DocumentUploadSerializer


@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def document_list_create(request):
    user_id = services.get_user_id(request)

    if request.method == "GET":
        return Response(services.list_documents(user_id))

    serializer = DocumentUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    try:
        document = services.upload_document(user_id, serializer.validated_data["file"])
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response(
            {"error": "Failed to process document. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(document, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
def document_delete(request, document_id):
    user_id = services.get_user_id(request)
    deleted = services.delete_document(document_id, user_id)
    if not deleted:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)
