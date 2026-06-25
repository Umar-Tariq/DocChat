from dataclasses import dataclass

from django.conf import settings


@dataclass
class TextChunk:
    content: str
    chunk_index: int
    page_number: int


def split_text_with_overlap(text: str, page_count: int) -> list[TextChunk]:
    chunk_size = settings.CHUNK_SIZE
    overlap = settings.CHUNK_OVERLAP

    if not text:
        return []

    chunks: list[TextChunk] = []
    start = 0
    index = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        content = text[start:end].strip()
        if content:
            page_number = _estimate_page_number(start, len(text), page_count)
            chunks.append(TextChunk(content=content, chunk_index=index, page_number=page_number))
            index += 1
        if end >= len(text):
            break
        start = end - overlap

    return chunks


def _estimate_page_number(char_offset: int, total_chars: int, page_count: int) -> int:
    if total_chars == 0 or page_count <= 1:
        return 1
    ratio = char_offset / total_chars
    page = int(ratio * page_count) + 1
    return min(max(page, 1), page_count)
