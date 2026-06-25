from abc import ABC, abstractmethod

from django.conf import settings
from openai import OpenAI

from api.services.rag.retriever import RetrievedChunk

SYSTEM_PROMPT = (
    "You are a helpful assistant that answers questions based ONLY on the provided document context. "
    "If the answer is not contained in the context, respond with exactly: "
    "\"I don't know based on this document.\" "
    "Do not use outside knowledge. Be concise and accurate."
)

UNKNOWN_ANSWER = "I don't know based on this document."


def is_unknown_answer(answer: str) -> bool:
    return answer.strip().lower() == UNKNOWN_ANSWER.lower()


def build_context_block(chunks: list[RetrievedChunk]) -> str:
    sections = []
    for chunk in chunks:
        sections.append(
            f"[Chunk {chunk.chunk_index} | Page {chunk.page_number}]\n{chunk.content}"
        )
    return "\n\n---\n\n".join(sections)


def build_citations(chunks: list[RetrievedChunk]) -> list[dict]:
    return [
        {
            "chunk_index": chunk.chunk_index,
            "page_number": chunk.page_number,
            "excerpt": chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
        }
        for chunk in chunks
    ]


class LLMProvider(ABC):
    @abstractmethod
    def generate_answer(
        self,
        question: str,
        context: str,
        history: list[dict] | None = None,
    ) -> str:
        pass


class OpenAILLMProvider(LLMProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_CHAT_MODEL

    def generate_answer(
        self,
        question: str,
        context: str,
        history: list[dict] | None = None,
    ) -> str:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history)
        messages.append(
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            }
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.2,
        )
        return response.choices[0].message.content or ""


def get_llm_provider() -> LLMProvider:
    return OpenAILLMProvider()
