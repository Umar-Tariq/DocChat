"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  UploadProgressOverlay,
  useUploadStageSimulator,
  type UploadStage,
} from "@/components/UploadProgressOverlay";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Document } from "@/types";

function StatusBadge({ status }: { status: Document["status"] }) {
  const config = {
    processing: { label: "Processing", className: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
    ready: { label: "Ready", className: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
    failed: { label: "Failed", className: "bg-red-500/15 text-red-400 ring-red-500/30" },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {status === "processing" && (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      )}
      {label}
    </span>
  );
}

function FileIcon({ type }: { type: Document["file_type"] }) {
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold uppercase ${
      type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-sky-500/15 text-sky-400"
    }`}>
      {type}
    </div>
  );
}

function ProcessingDocumentCard({ doc }: { doc: Document }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
          <span className="absolute inset-0 animate-ping rounded-xl bg-amber-400/20" />
          <span className="relative h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{doc.filename}</p>
          <p className="mt-1 text-xs text-amber-400/80">Indexing in progress — extracting & embedding...</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-amber-400 upload-progress-shimmer" />
          </div>
        </div>
        <StatusBadge status="processing" />
      </div>
    </div>
  );
}

interface ActiveUpload {
  filename: string;
  fileSize: number;
  fileType: string;
}

function DashboardContent() {
  const { user, getValidAccessToken } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [overlayStage, setOverlayStage] = useState<UploadStage>("uploading");
  const { stage: simulatedStage, setStage: setSimulatedStage } = useUploadStageSimulator(isUploading);

  const displayStage = uploadError ? "error" : overlayStage === "done" ? "done" : simulatedStage;

  const loadDocuments = useCallback(async () => {
    setError(null);
    const token = await getValidAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const docs = await api.listDocuments(token);
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [getValidAccessToken, router]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  function closeUploadOverlay() {
    setActiveUpload(null);
    setUploadError(null);
    setOverlayStage("uploading");
    setIsUploading(false);
  }

  async function uploadFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const fileType = ext === "pdf" ? "pdf" : ext === "txt" ? "txt" : ext;

    setIsUploading(true);
    setError(null);
    setUploadError(null);
    setOverlayStage("uploading");
    setActiveUpload({
      filename: file.name,
      fileSize: file.size,
      fileType,
    });

    const token = await getValidAccessToken();
    if (!token) {
      setUploadError("Session expired. Please log in again.");
      setIsUploading(false);
      return;
    }

    try {
      const result = await api.uploadDocument(file, token);
      await loadDocuments();

      if (result.status === "failed") {
        setUploadError(result.error_message || "Document processing failed.");
        setSimulatedStage("error" as UploadStage);
      } else {
        setOverlayStage("done");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setSimulatedStage("error" as UploadStage);
    } finally {
      setIsUploading(false);
    }
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) uploadFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleDelete(id: string) {
    const token = await getValidAccessToken();
    if (!token) return;

    try {
      await api.deleteDocument(id, token);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const readyCount = documents.filter((d) => d.status === "ready").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;

  return (
    <div className="app-gradient min-h-[calc(100vh-57px)]">
      {activeUpload && (
        <UploadProgressOverlay
          filename={activeUpload.filename}
          fileSize={activeUpload.fileSize}
          fileType={activeUpload.fileType}
          stage={displayStage}
          errorMessage={uploadError}
          onClose={closeUploadOverlay}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="text-sm text-zinc-500">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your Documents
          </h1>
          <p className="mt-2 max-w-xl text-zinc-400">
            Upload PDF or TXT files, then chat with AI that answers from your content.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total", value: documents.length, color: "text-white" },
            { label: "Ready", value: readyCount, color: "text-emerald-400" },
            { label: "Processing", value: processingCount, color: "text-amber-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-4 backdrop-blur sm:px-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-all ${
            isUploading
              ? "pointer-events-none border-indigo-500/40 bg-indigo-500/5 opacity-60"
              : isDragging
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-zinc-700/80 bg-zinc-900/30 hover:border-indigo-500/50 hover:bg-zinc-900/50"
          }`}
        >
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            isUploading ? "bg-indigo-500/20" : "bg-indigo-500/15"
          }`}>
            {isUploading ? (
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            ) : (
              "📄"
            )}
          </div>
          <p className="mt-4 text-base font-medium text-white">
            {isUploading ? "Processing your document..." : "Drop a file here or click to upload"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">PDF or TXT · Max 10 MB</p>
          <input
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-800/50" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-300">No documents yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Upload your first file above to start chatting with your content.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              All documents
            </h2>
            {documents.map((doc) =>
              doc.status === "processing" ? (
                <ProcessingDocumentCard key={doc._id} doc={doc} />
              ) : (
                <div
                  key={doc._id}
                  className="group flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700/80 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <FileIcon type={doc.file_type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{doc.filename}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>{new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}</span>
                        {doc.page_count > 0 && <span>· {doc.page_count} pages</span>}
                        <StatusBadge status={doc.status} />
                      </div>
                      {doc.status === "failed" && doc.error_message && (
                        <p className="mt-2 text-xs text-red-400/90 line-clamp-2">{doc.error_message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:ml-4">
                    {doc.status === "ready" && (
                      <Link
                        href={`/chat/${doc._id}?new=1`}
                        className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-400 sm:flex-none"
                      >
                        Open Chat
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="rounded-xl border border-zinc-700/80 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-red-800/60 hover:bg-red-950/30 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
