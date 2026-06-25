from rest_framework import serializers


class ConversationSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    document_id = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        return {
            "_id": instance.id_str,
            "document_id": instance.document_id,
            "title": instance.title,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
        }


class CreateConversationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)
