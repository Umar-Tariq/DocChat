import datetime

import mongoengine as me


class Conversation(me.Document):
    meta = {
        "collection": "conversations",
        "indexes": [
            ("user_id", "document_id", "-updated_at"),
        ],
    }

    user_id = me.StringField(required=True)
    document_id = me.StringField(required=True)
    title = me.StringField(default="New Chat", max_length=120)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    @property
    def id_str(self):
        return str(self.id)

    def touch(self):
        self.updated_at = datetime.datetime.utcnow()
        self.save()
