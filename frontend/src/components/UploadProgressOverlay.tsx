"use client";

import { useEffect, useState } from "react";

export type UploadStage =
  | "uploading"
  | "extracting"
  | "chunking"
  | "embedding"
  | "finishing"
  | "done"
  | "error";

const STEPS: { id: UploadStage; label: string; description: string }[] = [
  { id: "uploading", label: "Uploading", description: "Sending file to server" },
  { id: "extracting", label: "Extracting text", description: "Reading PDF / TXT content" },
  { id: "chunking", label: "Chunking", description: "Splitting into searchable pieces" },
  { id: "embedding", label: "Embedding", description: "Generating AI vectors with OpenAI" },
  { id: "finishing", label: "Finalizing", description: "Saving to your library" },
];

function stageIndex(stage: UploadStage): number {
  if (stage === "done" || stage === "error") return STEPS.length;
  const idx = STEPS.findIndex((s) => s.id === stage);
  return idx >= 0 ? idx : 0;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadProgressOverlayProps {
  filename: string;
  fileSize: number;
  fileType: string;
  stage: UploadStage;
  errorMessage?: string | null;
  onClose?: () => void;
}

export function UploadProgressOverlay({
  filename,
  fileSize,
  fileType,
  stage,
  errorMessage,
  onClose,
}: UploadProgressOverlayProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const currentStep = stageIndex(stage);
  const targetProgress =
    stage === "done" ? 100 : stage === "error" ? animatedProgress : ((currentStep + 0.6) / STEPS.length) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (stage === "done") return 100;
        if (stage === "error") return prev;
        const cap = targetProgress;
        if (prev >= cap) return prev;
        return Math.min(prev + 1.5, cap);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [stage, targetProgress]);

  const isComplete = stage === "done";
  const isError = stage === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-indigo-500/10"
        role="dialog"
        aria-labelledby="upload-title"
        aria-busy={!isComplete && !isError}
      >
        {/* Header */}
        <div className="border-b border-zinc-800/80 bg-zinc-900/80 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg ${
                isError
                  ? "bg-red-500/15"
                  : isComplete
                    ? "bg-emerald-500/15"
                    : "bg-indigo-500/15"
              }`}
            >
              {isError ? "⚠️" : isComplete ? "✓" : (
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="upload-title" className="truncate font-semibold text-white">
                {isError ? "Upload failed" : isComplete ? "Document ready!" : "Processing document"}
              </h2>
              <p className="mt-0.5 truncate text-sm text-zinc-400">{filename}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {fileType.toUpperCase()} · {formatFileSize(fileSize)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isError
                  ? "bg-red-500"
                  : isComplete
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500 upload-progress-shimmer"
              }`}
              style={{ width: `${isError ? 100 : animatedProgress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-medium text-zinc-500">
            {isComplete ? "100%" : isError ? "Failed" : `${Math.round(animatedProgress)}%`}
          </p>
        </div>

        {/* Steps */}
        <div className="px-6 py-5">
          <ul className="space-y-3">
            {STEPS.map((step, index) => {
              const isPast = currentStep > index || isComplete;
              const isCurrent = currentStep === index && !isComplete && !isError;
              const isPending = currentStep < index && !isComplete;

              return (
                <li
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isCurrent ? "bg-indigo-500/10 ring-1 ring-indigo-500/25" : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isPast
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isCurrent
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    {isPast ? "✓" : isCurrent ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isPending ? "text-zinc-600" : isCurrent ? "text-indigo-200" : "text-zinc-300"
                      }`}
                    >
                      {step.label}
                    </p>
                    {(isCurrent || isPast) && (
                      <p className="text-xs text-zinc-500">{step.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {isError && errorMessage && (
            <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {isComplete && (
            <p className="mt-4 text-center text-sm text-emerald-400/90">
              Your document is indexed and ready for chat.
            </p>
          )}

          {(isComplete || isError) && onClose && (
            <button
              onClick={onClose}
              className={`mt-5 w-full rounded-xl py-3 text-sm font-medium transition-colors ${
                isError
                  ? "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              }`}
            >
              {isComplete ? "Continue" : "Close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Advance stages on a timer while the upload API call is in flight. */
export function useUploadStageSimulator(isActive: boolean) {
  const [stage, setStage] = useState<UploadStage>("uploading");

  useEffect(() => {
    if (!isActive) {
      setStage("uploading");
      return;
    }

    setStage("uploading");
    const timers = [
      setTimeout(() => setStage("extracting"), 1200),
      setTimeout(() => setStage("chunking"), 2800),
      setTimeout(() => setStage("embedding"), 4500),
      setTimeout(() => setStage("finishing"), 7000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  return { stage, setStage };
}
