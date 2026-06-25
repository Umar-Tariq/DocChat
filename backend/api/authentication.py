from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from api.mongo_user import MongoTokenUser
from database.models import BlacklistedToken, User


class MongoJWTAuthentication(JWTAuthentication):
    """Validate JWT and load the user from MongoDB."""

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        if not user_id:
            raise InvalidToken("Token contained no recognizable user identification")

        jti = validated_token.get("jti")
        if jti and BlacklistedToken.objects(jti=jti).first():
            raise InvalidToken("Token is blacklisted")

        user = User.objects(id=user_id).first()
        if not user:
            raise InvalidToken("User not found")

        return MongoTokenUser(user)


def create_tokens_for_user(user_doc):
    token_user = MongoTokenUser(user_doc)
    refresh = RefreshToken.for_user(token_user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def blacklist_refresh_token(refresh_token_str):
    try:
        token = RefreshToken(refresh_token_str)
    except TokenError as exc:
        raise ValueError("Invalid refresh token") from exc

    from datetime import datetime, timezone

    exp_timestamp = token["exp"]
    expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).replace(tzinfo=None)

    BlacklistedToken(jti=token["jti"], expires_at=expires_at).save()
