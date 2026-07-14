"use client";

import { useState } from "react";
import { Send, RotateCcw, AlertTriangle } from "lucide-react";

type SendState = "idle" | "sending" | "sent" | "failed";

export function TextReplyBox({
  onSend,
  placeholder = "Type a message...",
}: {
  onSend: (text: string) => Promise<void>;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [state, setState] = useState<SendState>("idle");

  async function handleSend() {
    if (!text.trim()) return;
    setState("sending");
    try {
      await onSend(text.trim());
      setText("");
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4 text-green-800">
        <span className="text-base font-medium">Sent</span>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium active:scale-95"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="rounded-2xl border border-neutral-300 px-4 py-3 text-base"
      />
      {state === "failed" && (
        <div className="flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Failed to send. Check your connection and retry.</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleSend}
        disabled={state === "sending" || !text.trim()}
        className="flex h-14 items-center justify-center gap-2 rounded-full bg-blue-600 text-lg font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {state === "sending" ? (
          "Sending..."
        ) : state === "failed" ? (
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
  );
}
