from abc import ABC, abstractmethod
from enum import Enum

from django.conf import settings
from openai import OpenAI


class QueryType(str, Enum):
    GENERAL = "general"
    DOCUMENT = "document"


ROUTER_SYSTEM_PROMPT = """You are a query router for a document Q&A app called DocChat.

Classify the user message into exactly one category:

DOCUMENT — The user wants information from their uploaded document. This includes:
- Questions about content, facts, names, dates, skills, projects, summaries
- Requests like "what does it say about...", "list the experience", "who is mentioned"

GENERAL — The message does NOT require reading the document. This includes:
- Greetings (hello, hi, hey, good morning)
- Small talk (how are you, what's up)
- Thanks, goodbye, polite chit-chat
- Meta questions about the app itself (how does this work, what can you do)
- Off-topic questions unrelated to document content

Reply with ONLY one word: GENERAL or DOCUMENT"""


GENERAL_SYSTEM_PROMPT = """You are DocChat, a friendly document Q&A assistant.

The user sent a general message that does not require searching their document.
Respond naturally and briefly (1-3 sentences).

If they greeted you, greet them back and invite them to ask a question about their uploaded document.
Do not invent document content. Do not say you searched the document."""


class QueryRouter(ABC):
    @abstractmethod
    def classify(self, question: str) -> QueryType:
        pass

    @abstractmethod
    def answer_general(self, question: str, history: list[dict] | None = None) -> str:
        pass


class OpenAIQueryRouter(QueryRouter):
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_CHAT_MODEL

    def classify(self, question: str) -> QueryType:
        obvious = _classify_with_keywords(question)
        if obvious is not None:
            return obvious

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0,
            max_tokens=10,
        )
        label = (response.choices[0].message.content or "").strip().upper()
        if "DOCUMENT" in label:
            return QueryType.DOCUMENT
        return QueryType.GENERAL

    def answer_general(self, question: str, history: list[dict] | None = None) -> str:
        messages = [{"role": "system", "content": GENERAL_SYSTEM_PROMPT}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": question})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=200,
        )
        return response.choices[0].message.content or (
            "Hi! Ask me anything about your uploaded document and I'll answer from its content."
        )


def _classify_with_keywords(question: str) -> QueryType | None:
    """Fast path for obvious general messages — avoids an LLM call."""
    normalized = question.strip().lower()
    if not normalized:
        return QueryType.GENERAL

    general_exact = {
        "hi",
        "hello",
        "hey",
        "hiya",
        "yo",
        "thanks",
        "thank you",
        "thx",
        "bye",
        "goodbye",
        "good morning",
        "good afternoon",
        "good evening",
        "how are you",
        "what's up",
        "whats up",
        "sup",
    }
    if normalized.rstrip("!.?") in general_exact:
        return QueryType.GENERAL

    return None


def get_query_router() -> QueryRouter:
    return OpenAIQueryRouter()


def route_query(question: str) -> QueryType:
    return get_query_router().classify(question)


def answer_general_query(question: str, history: list[dict] | None = None) -> str:
    return get_query_router().answer_general(question, history)
