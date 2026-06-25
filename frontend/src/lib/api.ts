import type {
  AuthTokens,
  ChatMessage,
  ChatResponse,
  Conversation,
  Document,
  User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  isFormData?: boolean;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.isFormData
      ? (options.body as FormData)
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.detail || "Something went wrong";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  register(payload: { email: string; password: string; name?: string }) {
    return request<AuthTokens & { user: User }>("/auth/register/", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: { email: string; password: string }) {
    return request<AuthTokens & { user: User }>("/auth/login/", {
      method: "POST",
      body: payload,
    });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>("/auth/refresh/", {
      method: "POST",
      body: { refresh: refreshToken },
    });
  },

  logout(refreshToken: string, accessToken: string) {
    return request<{ message: string }>("/auth/logout/", {
      method: "POST",
      body: { refresh: refreshToken },
      token: accessToken,
    });
  },

  listDocuments(token: string) {
    return request<Document[]>("/documents/", { token });
  },

  uploadDocument(file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);
    return request<Document>("/documents/", {
      method: "POST",
      body: formData,
      token,
      isFormData: true,
    });
  },

  deleteDocument(id: string, token: string) {
    return request<void>(`/documents/${id}/`, {
      method: "DELETE",
      token,
    });
  },

  listConversations(documentId: string, token: string) {
    return request<Conversation[]>(`/documents/${documentId}/conversations/`, { token });
  },

  createConversation(documentId: string, token: string, title?: string) {
    return request<Conversation>(`/documents/${documentId}/conversations/`, {
      method: "POST",
      body: title ? { title } : {},
      token,
    });
  },

  deleteConversation(documentId: string, conversationId: string, token: string) {
    return request<void>(
      `/documents/${documentId}/conversations/${conversationId}/`,
      { method: "DELETE", token },
    );
  },

  getConversationMessages(documentId: string, conversationId: string, token: string) {
    return request<ChatMessage[]>(
      `/documents/${documentId}/conversations/${conversationId}/messages/`,
      { token },
    );
  },

  askQuestion(
    documentId: string,
    conversationId: string,
    question: string,
    token: string,
  ) {
    return request<ChatResponse>(
      `/documents/${documentId}/conversations/${conversationId}/chat/`,
      {
        method: "POST",
        body: { question },
        token,
      },
    );
  },
};
