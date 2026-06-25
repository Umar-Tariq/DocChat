"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ChatMessage, Citation, Conversation, Document } from "@/types";

const SUGGESTED_PROMPTS = [
  "Summarize this document",
  "What are the key points?",
  "List main topics covered",
];

function shortId(id: string) {
  return id.slice(-8);
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Citations({ citations }: { citations: Citation[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations.length) return null;

  return (
    <div className="mt-3 border-t border-zinc-700/40 pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-zinc-800/40"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <span className="text-indigo-400">📎</span>
          Sources
          <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
            {citations.length}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto custom-scrollbar">
          {citations.map((citation) => (
            <div
              key={`${citation.chunk_index}-${citation.page_number}`}
              className="rounded-lg border border-zinc-700/40 bg-zinc-950/50 px-3 py-2"
            >
              <span className="text-[11px] font-medium text-indigo-300">
                Chunk {citation.chunk_index} · Page {citation.page_number}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{citation.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="typing-dot h-2 w-2 rounded-full bg-zinc-500" />
      <span className="typing-dot h-2 w-2 rounded-full bg-zinc-500" />
      <span className="typing-dot h-2 w-2 rounded-full bg-zinc-500" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isUser ? "bg-indigo-500 text-white" : "bg-zinc-700 text-zinc-300"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>
      <div className={`max-w-[min(100%,36rem)] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-indigo-500 text-white"
              : "rounded-tl-md border border-zinc-700/50 bg-zinc-800/80 text-zinc-100"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && <Citations citations={message.citations} />}
        </div>
      </div>
    </div>
  );
}

function ConversationSidebar({
  conversations,
  activeId,
  isDraft,
  onSelect,
  onCreate,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  isDraft: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/60 lg:w-72">
      <div className="border-b border-zinc-800/80 px-3 py-3">
        <Link
          href="/dashboard"
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-white">Chats</h2>
          <button
            onClick={onCreate}
            className="flex h-8 items-center gap-1 rounded-lg bg-indigo-500 px-2.5 text-xs font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <span className="text-base leading-none">+</span> New
          </button>
        </div>
        <p className="mt-1 px-1 text-[11px] text-zinc-500">{conversations.length} conversation(s)</p>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        {isDraft && (
          <div className="mb-1 rounded-xl bg-indigo-500/15 px-3 py-3 ring-1 ring-indigo-500/30">
            <p className="truncate text-sm font-medium text-indigo-200">New Chat</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">Draft — not saved yet</p>
          </div>
        )}
        {conversations.length === 0 && !isDraft ? (
          <p className="px-3 py-6 text-center text-xs text-zinc-500">No chats yet</p>
        ) : (
          conversations.map((conversation) => {
            const isActive = activeId === conversation._id;
            return (
              <div
                key={conversation._id}
                className={`group relative mb-1 rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-500/15 ring-1 ring-indigo-500/30"
                    : "hover:bg-zinc-800/60"
                }`}
              >
                <button
                  onClick={() => onSelect(conversation._id)}
                  className="w-full px-3 py-3 text-left"
                >
                  <p className={`truncate text-sm font-medium ${isActive ? "text-indigo-200" : "text-zinc-200"}`}>
                    {conversation.title}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-600">
                      …{shortId(conversation._id)}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {formatTime(conversation.updated_at)}
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conversation._id); }}
                  className="absolute right-2 top-2 hidden rounded-md p-1 text-zinc-500 hover:bg-red-950/50 hover:text-red-400 group-hover:block"
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function ChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = params.id as string;
  const { getValidAccessToken } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(searchParams.get("new") === "1");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setIsDraft(false);
      setActiveConversationId(conversationId);
      router.replace(`/chat/${documentId}?c=${conversationId}`, { scroll: false });
    },
    [documentId, router],
  );

  const startDraftChat = useCallback(() => {
    setIsDraft(true);
    setActiveConversationId(null);
    setMessages([]);
    router.replace(`/chat/${documentId}?new=1`, { scroll: false });
  }, [documentId, router]);

  const loadConversations = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return null;

    const [list, docs] = await Promise.all([
      api.listConversations(documentId, token),
      api.listDocuments(token),
    ]);
    setConversations(list);
    setDocument(docs.find((d) => d._id === documentId) ?? null);
    return { list, token };
  }, [documentId, getValidAccessToken]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      const token = await getValidAccessToken();
      if (!token) return;
      const history = await api.getConversationMessages(documentId, conversationId, token);
      setMessages(history);
    },
    [documentId, getValidAccessToken],
  );

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loadConversations();
        if (!result) return;

        const { list } = result;
        const fromUrl = searchParams.get("c");
        const wantsNewChat = searchParams.get("new") === "1";
        const existingFromUrl = fromUrl && list.some((c) => c._id === fromUrl);

        if (wantsNewChat) {
          startDraftChat();
        } else if (existingFromUrl) {
          setIsDraft(false);
          setActiveConversationId(fromUrl);
          router.replace(`/chat/${documentId}?c=${fromUrl}`, { scroll: false });
          await loadMessages(fromUrl);
        } else if (list.length > 0) {
          startDraftChat();
        } else {
          startDraftChat();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleSelectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setMessages([]);
    selectConversation(conversationId);
    try {
      await loadMessages(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleCreateConversation() {
    startDraftChat();
  }

  async function handleDeleteConversation(conversationId: string) {
    const token = await getValidAccessToken();
    if (!token) return;
    try {
      await api.deleteConversation(documentId, conversationId, token);
      const remaining = conversations.filter((c) => c._id !== conversationId);
      setConversations(remaining);
      if (activeConversationId === conversationId) {
        if (remaining.length > 0) {
          await handleSelectConversation(remaining[0]._id);
        } else {
          startDraftChat();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isSending) return;

    const token = await getValidAccessToken();
    if (!token) return;

    const userQuestion = text.trim();
    setQuestion("");
    setIsSending(true);
    setError(null);

    let conversationId = activeConversationId;
    let isNewConversation = false;

    try {
      if (!conversationId) {
        const created = await api.createConversation(documentId, token);
        conversationId = created._id;
        isNewConversation = true;
        setConversations((prev) => [created, ...prev]);
        setActiveConversationId(conversationId);
        setIsDraft(false);
        router.replace(`/chat/${documentId}?c=${conversationId}`, { scroll: false });
      }

      const optimisticUser: ChatMessage = {
        _id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: "user",
        content: userQuestion,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);

      const response = await api.askQuestion(
        documentId,
        conversationId,
        userQuestion,
        token,
      );
      setMessages((prev) => [
        ...prev.filter((msg) => msg._id !== optimisticUser._id),
        { ...optimisticUser, _id: `user-${Date.now()}` },
        response.message,
      ]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? {
                ...conv,
                title: userQuestion.slice(0, 80),
                updated_at: new Date().toISOString(),
              }
            : conv,
        ),
      );
    } catch (err) {
      setMessages([]);
      if (isNewConversation && conversationId) {
        try {
          await api.deleteConversation(documentId, conversationId, token);
          setConversations((prev) => prev.filter((c) => c._id !== conversationId));
        } catch {
          // ignore cleanup errors
        }
        startDraftChat();
      }
      setError(err instanceof Error ? err.message : "Failed to get answer");
      setQuestion(userQuestion);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    sendMessage(question);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(question);
    }
  }

  function copyConversationId() {
    if (!activeConversationId) return;
    navigator.clipboard.writeText(activeConversationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-57px)] bg-zinc-950">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        isDraft={isDraft}
        onSelect={handleSelectConversation}
        onCreate={handleCreateConversation}
        onDelete={handleDeleteConversation}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/40 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-white sm:text-lg">
              {document?.filename ?? "Document Chat"}
            </h1>
            {isDraft ? (
              <p className="truncate text-xs text-zinc-500">New Chat</p>
            ) : (
              activeConversation && (
                <p className="truncate text-xs text-zinc-500">{activeConversation.title}</p>
              )
            )}
          </div>

          {activeConversation && !isDraft && (
            <button
              onClick={copyConversationId}
              className="ml-3 shrink-0 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-3 py-1.5 font-mono text-[11px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              title="Copy full conversation ID"
            >
              {copiedId ? "✓ Copied" : `ID …${shortId(activeConversation._id)}`}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-sm text-zinc-500">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl">
                  💬
                </div>
                <h2 className="mt-5 text-lg font-semibold text-white">
                  Ask anything about this document
                </h2>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">
                  I&apos;ll search your file and answer with citations from the source.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={isSending}
                      className="rounded-full border border-zinc-700/80 bg-zinc-800/50 px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message._id} message={message} />
              ))
            )}

            {isSending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
                  AI
                </div>
                <div className="rounded-2xl rounded-tl-md border border-zinc-700/50 bg-zinc-800/80 px-4 py-2">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800/80 bg-zinc-900/40 px-4 py-4 sm:px-6">
          {error && (
            <p className="mx-auto mb-3 max-w-3xl rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this document..."
                rows={1}
                disabled={isSending}
                className="max-h-32 w-full resize-none rounded-2xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
              />
              <p className="mt-1.5 text-[10px] text-zinc-600">Enter to send · Shift+Enter for new line</p>
            </div>
            <button
              type="submit"
              disabled={isSending || !question.trim()}
              className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-400 disabled:opacity-40"
              title="Send"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
