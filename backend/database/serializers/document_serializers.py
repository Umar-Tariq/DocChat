from rest_framework import serializers


class DocumentSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    filename = serializers.CharField(read_only=True)
    file_type = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    page_count = serializers.IntegerField(read_only=True)
    error_message = serializers.CharField(read_only=True, allow_null=True)
    uploaded_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        return {
            "_id": instance.id_str,
            "filename": instance.filename,
            "file_type": instance.file_type,
            "status": instance.status,
            "page_count": instance.page_count,
            "error_message": instance.error_message,
            "uploaded_at": instance.uploaded_at,
        }


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
