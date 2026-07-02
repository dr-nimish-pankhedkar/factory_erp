"use client";

import { useMemo, useState } from "react";
import { Mic, Square, Trash2, Send, RotateCcw, AlertTriangle } from "lucide-react";
import { useVoiceRecorder } from "@/lib/audio/useVoiceRecorder";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

type UploadState = "idle" | "uploading" | "sent" | "failed";

export interface VoiceRecorderProps {
  /** Persists the recorded clip (e.g. upload to Supabase Storage + insert a DB row). */
  onUpload: (audio: { blob: Blob; mimeType: string; durationSeconds: number }) => Promise<void>;
  maxDurationSeconds?: number;
  /** Shown above the record button, e.g. "Record task for Ramesh". */
  label?: string;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onUpload, maxDurationSeconds = 120, label }: VoiceRecorderProps) {
  const { status, elapsedSeconds, recorded, start, stop, reset } = useVoiceRecorder({
    maxDurationSeconds,
  });
  const [uploadState, setUploadState] = useState<UploadState>("idle");

  const previewUrl = useMemo(
    () => (recorded ? URL.createObjectURL(recorded.blob) : null),
    [recorded],
  );

  async function handleSend() {
    if (!recorded) return;
    setUploadState("uploading");
    try {
      await onUpload(recorded);
      setUploadState("sent");
    } catch {
      setUploadState("failed");
    }
  }

  function handleDiscard() {
    setUploadState("idle");
    reset();
  }

  if (uploadState === "sent") {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4 text-green-800">
        <span className="text-base font-medium">Sent</span>
        <button
          type="button"
          onClick={handleDiscard}
          className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium active:scale-95"
        >
          Record another
        </button>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-amber-50 p-4 text-amber-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="text-sm">Voice recording isn&apos;t supported on this browser.</span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-red-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="text-sm">Microphone access is blocked. Allow it in your browser settings.</span>
      </div>
    );
  }

  if (recorded) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4">
        <VoiceMessagePlayer src={previewUrl!} durationSeconds={recorded.durationSeconds} />
        {uploadState === "failed" && (
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Failed to send. Check your connection and retry.</span>
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            aria-label="Discard recording"
            disabled={uploadState === "uploading"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={uploadState === "uploading"}
            aria-label={uploadState === "failed" ? "Retry send" : "Send voice note"}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-lg font-medium text-white active:scale-95 disabled:opacity-60"
          >
            {uploadState === "uploading" ? (
              "Sending..."
            ) : uploadState === "failed" ? (
              <>
                <RotateCcw className="h-5 w-5" /> Retry
              </>
            ) : (
              <>
                <Send className="h-5 w-5" /> Send
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {label && <p className="text-base font-medium text-neutral-700">{label}</p>}
      {status === "recording" ? (
        <>
          <div className="flex items-center gap-2 text-2xl font-semibold text-red-600 tabular-nums">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
            {formatTime(elapsedSeconds)}
            <span className="text-sm font-normal text-neutral-400">
              / {formatTime(maxDurationSeconds)}
            </span>
          </div>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg active:scale-95"
          >
            <Square className="h-8 w-8" fill="currentColor" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label="Start recording"
          disabled={status === "requesting-permission"}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg active:scale-95 disabled:opacity-60"
        >
          <Mic className="h-8 w-8" />
        </button>
      )}
    </div>
  );
}
