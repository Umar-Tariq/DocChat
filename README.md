# DocChat

**Chat with your documents — powered by AI.**

DocChat is a full-stack SaaS application that lets users upload PDF or TXT files and ask questions answered strictly from their document content. Built with **Django REST Framework**, **Next.js**, **MongoDB**, and **OpenAI**, it uses retrieval-augmented generation (RAG) to deliver accurate answers with source citations.

---

## What It Does

1. **Sign up / Log in** — JWT-based authentication with secure token refresh.
2. **Upload documents** — PDF or TXT files are extracted, chunked, and embedded automatically.
3. **Chat with your file** — Ask questions and get answers grounded in the document, not hallucinated facts.
4. **See citations** — Every answer can include expandable sources showing chunk index and page number.
5. **Multiple conversations** — Open several chat threads per document; each keeps its own history.
6. **Smart routing** — A router agent detects general messages (e.g. "hello") vs document questions and responds accordingly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5, Django REST Framework |
| Database | MongoDB (mongoengine) — all app data |
| Auth | JWT via `djangorestframework-simplejwt` |
| AI | OpenAI API (embeddings + chat completions) |
| Vector search | Cosine similarity in Python/NumPy (MongoDB-stored embeddings) |

> Django's SQLite is used only for internal framework tables. All users, documents, chunks, and chats live in **MongoDB** with `_id` as the primary key.

---

## Features

### Document Management
- Drag-and-drop upload with step-by-step processing overlay
- File validation (PDF/TXT only, 10 MB max)
- Per-user document dashboard with status badges (processing / ready / failed)
- Delete documents along with all related chunks and chats

### RAG Pipeline
- **Text extraction** — `pypdf` for PDFs, UTF-8 for TXT
- **Chunking** — overlapping text chunks (configurable size & overlap)
- **Embeddings** — OpenAI `text-embedding-3-small`
- **Retrieval** — top-k cosine similarity search scoped per document
- **Generation** — GPT answers only from retrieved context; says *"I don't know based on this document"* when the answer isn't there

### Intelligent Chat
- **Router agent** — classifies messages as `general` or `document` before processing
- **Conversation memory** — sends last N messages to OpenAI for follow-up context
- **Draft chats** — new conversations are not saved until the first question is sent
- **Collapsible citations** — sources shown in a dropdown, not cluttering the UI

### Security & Multi-Tenancy
- Every database query is scoped to the authenticated `user_id`
- Users can only access their own documents, chunks, and conversations
- Passwords hashed with Django's `make_password`
- Refresh tokens blacklisted on logout

---

## Project Structure

```
DocChat/
├── backend/                         # Django REST API
│   ├── api/
│   │   ├── controllers/             # Feature modules
│   │   │   ├── auth/                # Register, login, refresh, logout
│   │   │   ├── documents/           # Upload, list, delete
│   │   │   └── chat/                # Conversations & messaging
│   │   ├── services/rag/            # RAG pipeline (isolated & swappable)
│   │   │   ├── text_extractor.py
│   │   │   ├── chunker.py
│   │   │   ├── embeddings.py
│   │   │   ├── retriever.py
│   │   │   ├── llm.py
│   │   │   ├── router.py            # General vs document query routing
│   │   │   ├── history.py
│   │   │   └── pipeline.py
│   │   ├── authentication.py        # MongoDB JWT auth
│   │   └── urls.py
│   ├── database/
│   │   ├── models/                  # mongoengine documents
│   │   └── serializers/
│   ├── docchat/                     # Django settings & URLs
│   ├── samples/sample.txt           # Test file for quick upload
│   └── requirements.txt
│
└── frontend/                        # Next.js App
    └── src/
        ├── app/                     # Pages: /, /login, /signup, /dashboard, /chat/[id]
        ├── components/              # Navbar, upload overlay, protected routes
        └── lib/                     # API client & auth context
```

### Architecture Pattern

| Layer | Responsibility |
|---|---|
| `views.py` | HTTP handling — function-based with `@api_view` decorators |
| `services.py` | Business logic — plain functions, no classes |
| `models/` | MongoDB document schemas (mongoengine) |
| `serializers/` | Request/response validation & JSON formatting |
| `services/rag/` | AI pipeline — chunk, embed, retrieve, generate |

---

## MongoDB Collections

| Collection | Description |
|---|---|
| `users` | Email, password hash, name |
| `documents` | Filename, status, page count, upload date |
| `chunks` | Text content + embedding vector per document |
| `conversations` | Chat threads linked to a document |
| `chat_messages` | User/assistant messages with citations |
| `blacklisted_tokens` | Invalidated refresh tokens (logout) |

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | Get access + refresh tokens |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `POST` | `/api/auth/logout/` | Blacklist refresh token |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents/` | List current user's documents |
| `POST` | `/api/documents/` | Upload PDF or TXT |
| `DELETE` | `/api/documents/{id}/` | Delete document and all related data |

### Conversations & Chat

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents/{id}/conversations/` | List conversations (with messages only) |
| `POST` | `/api/documents/{id}/conversations/` | Create a conversation |
| `DELETE` | `/api/documents/{id}/conversations/{conv_id}/` | Delete a conversation |
| `GET` | `/api/documents/{id}/conversations/{conv_id}/messages/` | Get chat history |
| `POST` | `/api/documents/{id}/conversations/{conv_id}/chat/` | Send a question, get answer + citations |

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

---

## Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com/api-keys)

---

## Local Setup

### 1. Clone & start MongoDB

```bash
# Local MongoDB should be running on:
mongodb://localhost:27017
```

For Atlas, copy your connection string and use it as `MONGODB_URI`.

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux
```

Edit `backend/.env` and set at minimum:

```env
SECRET_KEY=your-random-secret-key
MONGODB_URI=mongodb://localhost:27017/docchat
OPENAI_API_KEY=sk-your-real-openai-key
```

Then run:

```bash
python manage.py migrate
python manage.py init_db --seed
python manage.py runserver
```

Backend: **http://localhost:8000**

Demo user after `--seed`: `demo@docchat.com` / `demo12345`

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local     # macOS / Linux
npm run dev
```

Frontend: **http://localhost:3000**

---

## Quick Test

1. Open **http://localhost:3000** and sign up (or use the demo account).
2. Go to **Dashboard** → upload `backend/samples/sample.txt`.
3. Wait for the upload overlay to finish (status: **Ready**).
4. Click **Open Chat** → ask: *"What is DocChat?"*
5. Expand **Sources** on the answer to see chunk citations.
6. Try **"hello"** — the router responds conversationally without searching the document.
7. Click **+ New** to start another chat thread on the same document.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | — | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `MONGODB_URI` | `mongodb://localhost:27017/docchat` | MongoDB connection |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | Chat model |
| `CHUNK_SIZE` | `1000` | Characters per chunk |
| `CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `RETRIEVAL_TOP_K` | `5` | Chunks sent to LLM as context |
| `CONVERSATION_HISTORY_LIMIT` | `20` | Messages sent for chat memory |
| `MAX_UPLOAD_SIZE_MB` | `10` | Max upload file size |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed frontend origins |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend API base URL |

---

## How RAG Works

```
Upload PDF/TXT
      │
      ▼
Extract text (pypdf / UTF-8)
      │
      ▼
Split into overlapping chunks
      │
      ▼
Generate embeddings (OpenAI) → store in MongoDB
      │
      ▼
User asks a question
      │
      ▼
Router agent: general or document?
      │
      ├── General → friendly reply (with conversation history)
      │
      └── Document → embed question
                → cosine similarity search (top-k chunks)
                → send chunks as context to GPT
                → return answer + citations
```

---

## Extending the System

### Swap Vector Store (FAISS / Pinecone)

Retrieval is behind a single interface in `api/services/rag/retriever.py`:

```python
class VectorRetriever(ABC):
    def retrieve(self, query_embedding, document_id, user_id, top_k) -> list[RetrievedChunk]:
        ...
```

Implement a new class, update `get_retriever()` — no changes needed in views or chat services.

### Swap LLM or Embeddings Provider

- **LLM:** implement `LLMProvider` in `api/services/rag/llm.py`
- **Embeddings:** implement `EmbeddingProvider` in `api/services/rag/embeddings.py`

---

## Deployment

| Component | Recommended Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) or [Railway](https://railway.app) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |

**Production checklist:**

- Set `DEBUG=False` and a strong `SECRET_KEY`
- Restrict `ALLOWED_HOSTS` to your domain
- Set `CORS_ALLOWED_ORIGINS` to your Vercel URL
- Store all secrets in platform environment variables
- Run `python manage.py init_db` after deploy to ensure MongoDB indexes

---

## License

This project is built as a portfolio SaaS demo. Use and modify freely for learning and development.
