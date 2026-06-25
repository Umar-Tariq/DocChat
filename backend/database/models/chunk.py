import mongoengine as me


class Chunk(me.Document):
    meta = {
        "collection": "chunks",
        "indexes": [
            "user_id",
            "document_id",
            ("document_id", "chunk_index"),
        ],
    }

    user_id = me.StringField(required=True)
    document_id = me.StringField(required=True)
    content = me.StringField(required=True)
    embedding = me.ListField(me.FloatField(), required=True)
    chunk_index = me.IntField(required=True)
    page_number = me.IntField(default=0)

    @property
    def id_str(self):
        return str(self.id)
