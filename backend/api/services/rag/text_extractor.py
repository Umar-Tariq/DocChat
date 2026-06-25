from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text.strip())
    full_text = "\n\n".join(pages)
    return full_text, len(reader.pages)


def extract_text_from_txt(file_bytes: bytes) -> tuple[str, int]:
    text = file_bytes.decode("utf-8", errors="replace").strip()
    return text, 1


def extract_text(file_bytes: bytes, file_type: str) -> tuple[str, int]:
    if file_type == "pdf":
        return extract_text_from_pdf(file_bytes)
    if file_type == "txt":
        return extract_text_from_txt(file_bytes)
    raise ValueError(f"Unsupported file type: {file_type}")
