from django.apps import AppConfig


class DatabaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "database"

    def ready(self):
        from database.connection import connect_mongodb

        connect_mongodb()
