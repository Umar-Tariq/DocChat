from rest_framework import serializers


class CitationSerializer(serializers.Serializer):
    chunk_index = serializers.IntegerField()
    page_number = serializers.IntegerField()
    excerpt = serializers.CharField()


class ChatQuestionSerializer(serializers.Serializer):
    question = serializers.CharField(min_length=1, max_length=2000)


class ChatMessageSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    conversation_id = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    citations = CitationSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        return {
            "_id": instance.id_str,
            "conversation_id": instance.conversation_id,
            "role": instance.role,
            "content": instance.content,
            "citations": instance.citations or [],
            "created_at": instance.created_at,
        }


class ChatResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    citations = CitationSerializer(many=True)
    route = serializers.CharField(required=False)
    conversation_id = serializers.CharField()
    message = ChatMessageSerializer()
