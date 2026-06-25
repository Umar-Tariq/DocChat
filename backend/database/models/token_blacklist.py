import datetime

import mongoengine as me


class BlacklistedToken(me.Document):
    meta = {
        "collection": "blacklisted_tokens",
        "indexes": [
            {"fields": ["jti"], "unique": True},
            {"fields": ["expires_at"], "expireAfterSeconds": 0},
        ],
    }

    jti = me.StringField(required=True, unique=True)
    expires_at = me.DateTimeField(required=True)
    blacklisted_at = me.DateTimeField(default=datetime.datetime.utcnow)
