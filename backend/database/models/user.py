import datetime

import mongoengine as me


class User(me.Document):
    meta = {
        "collection": "users",
        "indexes": [{"fields": ["email"], "unique": True}],
    }

    email = me.EmailField(required=True, unique=True)
    password_hash = me.StringField(required=True)
    name = me.StringField(max_length=150)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    @property
    def id_str(self):
        return str(self.id)

    def __str__(self):
        return self.email
