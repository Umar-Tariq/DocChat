from api.services.rag.chunker import split_text_with_overlap
from api.services.rag.embeddings import get_embedding_provider
from api.services.rag.llm import (
    UNKNOWN_ANSWER,
    build_citations,
    build_context_block,
    get_llm_provider,
    is_unknown_answer,
)
from api.services.rag.retriever import retrieve_context
from api.services.rag.history import build_openai_history
from api.services.rag.router import QueryType, answer_general_query, route_query
from api.services.rag.text_extractor import extract_text
from database.models import Chunk, Document, DocumentStatus


def process_document_upload(document: Document, file_bytes: bytes) -> None:
    """Extract text, chunk, embed, and persist chunks for a document."""
    try:
        text, page_count = extract_text(file_bytes, document.file_type)
        if not text.strip():
            raise ValueError("No text could be extracted from the file")

        document.page_count = page_count
        text_chunks = split_text_with_overlap(text, page_count)
        if not text_chunks:
            raise ValueError("Document produced no chunks")

        texts = [chunk.content for chunk in text_chunks]
        embeddings = get_embedding_provider().embed_texts(texts)

        chunk_docs = []
        for text_chunk, embedding in zip(text_chunks, embeddings):
            chunk_docs.append(
                Chunk(
                    user_id=document.user_id,
                    document_id=document.id_str,
                    content=text_chunk.content,
                    embedding=embedding,
                    chunk_index=text_chunk.chunk_index,
                    page_number=text_chunk.page_number,
                )
            )

        Chunk.objects.insert(chunk_docs, load_bulk=False)

        document.status = DocumentStatus.READY
        document.error_message = None
        document.save()
    except Exception as exc:
        document.status = DocumentStatus.FAILED
        document.error_message = str(exc)
        document.save()
        raise


def answer_question(
    question: str,
    document: Document,
    conversation_history: list[dict] | None = None,
) -> dict:
    """Route the query, then answer via general chat or document RAG."""
    if document.status != DocumentStatus.READY:
        raise ValueError("Document is not ready for chat")

    history = build_openai_history(conversation_history or [])
    query_type = route_query(question)

    if query_type == QueryType.GENERAL:
        return {
            "answer": answer_general_query(question, history),
            "citations": [],
            "route": QueryType.GENERAL.value,
        }

    return _answer_from_document(question, document, history)


def _answer_from_document(
    question: str,
    document: Document,
    history: list[dict],
) -> dict:
    """Embed question, retrieve chunks, and generate a grounded answer."""
    embedding_provider = get_embedding_provider()
    query_embedding = embedding_provider.embed_query(question)

    retrieved = retrieve_context(
        query_embedding=query_embedding,
        document_id=document.id_str,
        user_id=document.user_id,
    )

    if not retrieved:
        return {
            "answer": UNKNOWN_ANSWER,
            "citations": [],
            "route": QueryType.DOCUMENT.value,
        }

    context = build_context_block(retrieved)
    answer = get_llm_provider().generate_answer(question, context, history)
    citations = [] if is_unknown_answer(answer) else build_citations(retrieved)

    return {
        "answer": answer,
        "citations": citations,
        "route": QueryType.DOCUMENT.value,
    }
