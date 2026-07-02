"use client";

import { Mic, Square, Trash2, AlertTriangle } from "lucide-react";
import { useVoiceRecorder, type RecordedAudio } from "@/lib/audio/useVoiceRecorder";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { useEffect, useMemo } from "react";

export interface VoiceCaptureProps {
  audio: RecordedAudio | null;
  onChange: (audio: RecordedAudio | null) => void;
  maxDurationSeconds?: number;
  label?: string;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Like <VoiceRecorder />, but hands the recorded blob back to the parent
// instead of uploading immediately — for forms where other fields (assignees,
// due date, category) still need filling before the whole thing is submitted.
export function VoiceCapture({ audio, onChange, maxDurationSeconds = 120, label }: VoiceCaptureProps) {
  const { status, elapsedSeconds, recorded, start, stop, reset } = useVoiceRecorder({
    maxDurationSeconds,
  });

  const previewUrl = useMemo(() => {
    const source = audio ?? recorded;
    return source ? URL.createObjectURL(source.blob) : null;
  }, [audio, recorded]);

  useEffect(() => {
    if (recorded && !audio) onChange(recorded);
  }, [recorded, audio, onChange]);

  function handleClear() {
    reset();
    onChange(null);
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

  if (audio) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-neutral-50 p-3">
        <VoiceMessagePlayer src={previewUrl!} durationSeconds={audio.durationSeconds} />
        <button
          type="button"
          onClick={handleClear}
          className="flex h-11 items-center justify-center gap-2 self-start rounded-full bg-neutral-200 px-4 text-sm font-medium text-neutral-700 active:scale-95"
        >
          <Trash2 className="h-4 w-4" /> Re-record
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className="text-sm font-medium text-neutral-600">{label}</p>}
      {status === "recording" ? (
        <>
          <div className="flex items-center gap-2 text-xl font-semibold text-red-600 tabular-nums">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
            {formatTime(elapsedSeconds)}
          </div>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg active:scale-95"
          >
            <Square className="h-6 w-6" fill="currentColor" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label="Start recording"
          disabled={status === "requesting-permission"}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg active:scale-95 disabled:opacity-60"
        >
          <Mic className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
