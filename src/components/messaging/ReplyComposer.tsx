"use client";

import { useState } from "react";
import { Mic, Keyboard } from "lucide-react";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { TextReplyBox } from "./TextReplyBox";
import type { RecordedAudio } from "@/lib/audio/useVoiceRecorder";

type ReplyMode = "voice" | "text";

export function ReplyComposer({
  label = "Reply",
  onSendVoice,
  onSendText,
}: {
  label?: string;
  onSendVoice: (audio: RecordedAudio) => Promise<void>;
  onSendText: (text: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<ReplyMode>("voice");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <div className="flex rounded-full bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setMode("voice")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              mode === "voice" ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500"
            }`}
          >
            <Mic className="h-4 w-4" /> Voice
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              mode === "text" ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500"
            }`}
          >
            <Keyboard className="h-4 w-4" /> Type
          </button>
        </div>
      </div>
      {mode === "voice" ? (
        <VoiceRecorder onUpload={onSendVoice} />
      ) : (
        <TextReplyBox onSend={onSendText} placeholder="Type your reply..." />
      )}
    </div>
  );
}
