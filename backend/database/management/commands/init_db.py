from django.core.management.base import BaseCommand

from database.models import BlacklistedToken, ChatMessage, Chunk, Conversation, Document, User


class Command(BaseCommand):
    help = "Ensure MongoDB indexes and optionally seed a test user"

    def add_arguments(self, parser):
        parser.add_argument(
            "--seed",
            action="store_true",
            help="Create a demo user (demo@docchat.com / demo12345)",
        )

    def handle(self, *args, **options):
        for model in (User, Document, Chunk, Conversation, ChatMessage, BlacklistedToken):
            model.ensure_indexes()
            self.stdout.write(self.style.SUCCESS(f"Indexes ensured for {model.__name__}"))

        if options["seed"]:
            from django.contrib.auth.hashers import make_password

            email = "demo@docchat.com"
            if User.objects(email=email).first():
                self.stdout.write(self.style.WARNING("Demo user already exists"))
                return

            User(
                email=email,
                password_hash=make_password("demo12345"),
                name="Demo User",
            ).save()
            self.stdout.write(
                self.style.SUCCESS("Demo user created: demo@docchat.com / demo12345")
            )
