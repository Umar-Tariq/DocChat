"""Lightweight user wrapper so simplejwt can issue tokens for MongoDB users."""


class MongoTokenUser:
    """Mimics the minimal interface expected by rest_framework_simplejwt."""

    def __init__(self, user_doc):
        self.user_doc = user_doc
        self.id = user_doc.id_str
        self.pk = user_doc.id_str
        self.is_authenticated = True

    @property
    def email(self):
        return self.user_doc.email
