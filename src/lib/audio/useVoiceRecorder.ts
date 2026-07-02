"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickSupportedAudioMimeType } from "./mime";

export type RecorderStatus =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "stopped"
  | "denied"
  | "unsupported";

export interface RecordedAudio {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}

interface UseVoiceRecorderOptions {
  maxDurationSeconds?: number;
}

export function useVoiceRecorder({
  maxDurationSeconds = 120,
}: UseVoiceRecorderOptions = {}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recorded, setRecorded] = useState<RecordedAudio | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      setStatus("unsupported");
      return;
    }
    const mimeType = pickSupportedAudioMimeType();
    if (!mimeType) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting-permission");
    setRecorded(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        clearTimer();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const durationSeconds = Math.round(
          (Date.now() - startedAtRef.current) / 1000,
        );
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecorded({ blob, mimeType, durationSeconds });
        setStatus("stopped");
      };

      startedAtRef.current = Date.now();
      recorder.start();
      setStatus("recording");
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stop();
          }
          return next;
        });
      }, 1000);
    } catch {
      setStatus("denied");
    }
  }, [clearTimer, maxDurationSeconds, stop]);

  const reset = useCallback(() => {
    clearTimer();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setRecorded(null);
    setElapsedSeconds(0);
    setStatus("idle");
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [clearTimer]);

  return {
    status,
    elapsedSeconds,
    maxDurationSeconds,
    recorded,
    start,
    stop,
    reset,
  };
}
