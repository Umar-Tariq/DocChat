from django.conf import settings


def build_openai_history(messages: list[dict]) -> list[dict]:
    """Convert stored messages to OpenAI chat format (role + content only)."""
    limit = settings.CONVERSATION_HISTORY_LIMIT
    recent = messages[-limit:] if limit else messages
    return [{"role": msg["role"], "content": msg["content"]} for msg in recent]
