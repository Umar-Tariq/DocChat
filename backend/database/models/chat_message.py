import datetime

import mongoengine as me


class ChatMessage(me.Document):
    meta = {
        "collection": "chat_messages",
        "indexes": [
            ("conversation_id", "created_at"),
            ("user_id", "document_id", "created_at"),
        ],
    }

    user_id = me.StringField(required=True)
    document_id = me.StringField(required=True)
    conversation_id = me.StringField(required=True)
    role = me.StringField(required=True, choices=("user", "assistant"))
    content = me.StringField(required=True)
    citations = me.ListField(me.DictField(), default=list)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    @property
    def id_str(self):
        return str(self.id)
