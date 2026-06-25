export interface User {
  _id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Document {
  _id: string;
  filename: string;
  file_type: "pdf" | "txt";
  status: "processing" | "ready" | "failed";
  page_count: number;
  error_message: string | null;
  uploaded_at: string;
}

export interface Citation {
  chunk_index: number;
  page_number: number;
  excerpt: string;
}

export interface ChatMessage {
  _id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Conversation {
  _id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  route?: string;
  conversation_id: string;
  message: ChatMessage;
}
