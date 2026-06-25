import mongoengine
from django.conf import settings


def connect_mongodb():
    """Connect mongoengine to MongoDB. Safe to call once at startup."""
    if not mongoengine.connection._connections:
        mongoengine.connect(
            host=settings.MONGODB_URI,
            alias="default",
        )
