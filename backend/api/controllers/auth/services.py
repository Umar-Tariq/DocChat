from django.contrib.auth.hashers import check_password, make_password
from mongoengine.errors import NotUniqueError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from api.authentication import blacklist_refresh_token, create_tokens_for_user
from database.models import User
from database.serializers import UserSerializer


def register_user(email: str, password: str, name: str = "") -> dict:
    if User.objects(email=email.lower()).first():
        raise ValueError("A user with this email already exists")

    user = User(
        email=email.lower(),
        password_hash=make_password(password),
        name=name.strip(),
    )
    try:
        user.save()
    except NotUniqueError:
        raise ValueError("A user with this email already exists") from None

    tokens = create_tokens_for_user(user)
    return {
        **tokens,
        "user": UserSerializer().to_representation(user),
    }


def login_user(email: str, password: str) -> dict:
    user = User.objects(email=email.lower()).first()
    if not user or not check_password(password, user.password_hash):
        raise ValueError("Invalid email or password")

    tokens = create_tokens_for_user(user)
    return {
        **tokens,
        "user": UserSerializer().to_representation(user),
    }


def refresh_tokens(refresh_token: str) -> dict:
    try:
        token = RefreshToken(refresh_token)
    except TokenError as exc:
        raise ValueError("Invalid or expired refresh token") from exc

    user_id = token.get("user_id")
    user = User.objects(id=user_id).first()
    if not user:
        raise ValueError("User not found")

    blacklist_refresh_token(refresh_token)
    return create_tokens_for_user(user)


def logout_user(refresh_token: str) -> None:
    blacklist_refresh_token(refresh_token)
