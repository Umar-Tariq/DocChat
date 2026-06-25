import datetime

import mongoengine as me


class DocumentStatus:
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

    CHOICES = (PROCESSING, READY, FAILED)


class Document(me.Document):
    meta = {
        "collection": "documents",
        "indexes": [
            "user_id",
            ("user_id", "-uploaded_at"),
        ],
    }

    user_id = me.StringField(required=True)
    filename = me.StringField(required=True, max_length=255)
    file_type = me.StringField(required=True, choices=("pdf", "txt"))
    status = me.StringField(
        required=True,
        default=DocumentStatus.PROCESSING,
        choices=DocumentStatus.CHOICES,
    )
    page_count = me.IntField(default=0)
    error_message = me.StringField()
    uploaded_at = me.DateTimeField(default=datetime.datetime.utcnow)

    @property
    def id_str(self):
        return str(self.id)
