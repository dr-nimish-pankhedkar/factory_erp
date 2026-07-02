"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import Image from "next/image";

export interface VoiceMessagePlayerProps {
  src: string;
  /** Known duration in seconds, shown before metadata loads. */
  durationSeconds?: number;
  authorName?: string;
  authorPhotoUrl?: string;
  timestamp?: string;
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceMessagePlayer({
  src,
  durationSeconds,
  authorName,
  authorPhotoUrl,
  timestamp,
}: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    const value = Number(event.target.value);
    if (audio) audio.currentTime = value;
    setCurrentTime(value);
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" fill="currentColor" />
        ) : (
          <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {authorName && (
          <div className="flex items-center gap-2">
            {authorPhotoUrl && (
              <Image
                src={authorPhotoUrl}
                alt={authorName}
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 rounded-full object-cover"
              />
            )}
            <span className="truncate text-sm font-medium text-neutral-700">{authorName}</span>
            {timestamp && <span className="shrink-0 text-xs text-neutral-400">{timestamp}</span>}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek"
            className="h-2 flex-1 cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #2563eb ${progressPercent}%, #e5e7eb ${progressPercent}%)`,
            }}
          />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-500">
            {formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
