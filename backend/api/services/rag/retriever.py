from abc import ABC, abstractmethod
from dataclasses import dataclass

import numpy as np
from django.conf import settings

from database.models import Chunk


@dataclass
class RetrievedChunk:
    chunk_index: int
    page_number: int
    content: str
    score: float


class VectorRetriever(ABC):
    @abstractmethod
    def retrieve(
        self,
        query_embedding: list[float],
        document_id: str,
        user_id: str,
        top_k: int,
    ) -> list[RetrievedChunk]:
        pass


class MongoCosineRetriever(VectorRetriever):
    """Cosine similarity search over embeddings stored in MongoDB."""

    def retrieve(
        self,
        query_embedding: list[float],
        document_id: str,
        user_id: str,
        top_k: int,
    ) -> list[RetrievedChunk]:
        chunks = Chunk.objects(document_id=document_id, user_id=user_id)
        if not chunks:
            return []

        query = np.array(query_embedding, dtype=np.float32)
        query_norm = np.linalg.norm(query)
        if query_norm == 0:
            return []

        scored: list[RetrievedChunk] = []
        for chunk in chunks:
            vector = np.array(chunk.embedding, dtype=np.float32)
            vector_norm = np.linalg.norm(vector)
            if vector_norm == 0:
                continue
            score = float(np.dot(query, vector) / (query_norm * vector_norm))
            scored.append(
                RetrievedChunk(
                    chunk_index=chunk.chunk_index,
                    page_number=chunk.page_number,
                    content=chunk.content,
                    score=score,
                )
            )

        scored.sort(key=lambda item: item.score, reverse=True)
        return scored[:top_k]


def get_retriever() -> VectorRetriever:
    return MongoCosineRetriever()


def retrieve_context(
    query_embedding: list[float],
    document_id: str,
    user_id: str,
    top_k: int | None = None,
) -> list[RetrievedChunk]:
    k = top_k or settings.RETRIEVAL_TOP_K
    return get_retriever().retrieve(query_embedding, document_id, user_id, k)
