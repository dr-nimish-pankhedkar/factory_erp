"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/storage";
import { extensionForMimeType } from "@/lib/audio/mime";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { VoiceMessagePlayer } from "@/components/voice/VoiceMessagePlayer";
import { StatusIcon } from "./StatusIcon";
import type { TaskStatus } from "@/types/database";

export interface ThreadEvent {
  id: string;
  event_type: string;
  audioUrl: string | null;
  statusFrom: TaskStatus | null;
  statusTo: TaskStatus | null;
  createdAt: string;
  authorName: string;
  authorPhotoUrl: string | null;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export function TaskThread({
  taskAssigneeId,
  currentStatus,
  canUpdateStatus,
  initialEvents,
}: {
  taskAssigneeId: string;
  currentStatus: TaskStatus;
  canUpdateStatus: boolean;
  initialEvents: ThreadEvent[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(next: TaskStatus) {
    if (next === status) return;
    setUpdating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("task_assignees")
      .update({ status: next, status_updated_at: new Date().toISOString() })
      .eq("id", taskAssigneeId);

    await supabase.from("task_events").insert({
      task_assignee_id: taskAssigneeId,
      author_id: user.id,
      event_type: "status_change",
      status_from: status,
      status_to: next,
    });

    setStatus(next);
    setUpdating(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {canUpdateStatus && (
        <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              disabled={updating}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 disabled:opacity-50 ${
                status === opt.value ? "bg-blue-50" : ""
              }`}
            >
              <StatusIcon status={opt.value} />
              <span className="text-xs font-medium text-neutral-600">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {initialEvents.map((event) => (
          <div key={event.id} className="flex flex-col gap-1">
            {event.event_type === "status_change" ? (
              <p className="self-center rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500">
                {event.authorName} marked {event.statusTo?.replace("_", " ")}
              </p>
            ) : event.audioUrl ? (
              <VoiceMessagePlayer
                src={event.audioUrl}
                authorName={event.authorName}
                authorPhotoUrl={event.authorPhotoUrl ?? undefined}
                timestamp={new Date(event.createdAt).toLocaleString()}
              />
            ) : null}
          </div>
        ))}
        {initialEvents.length === 0 && <p className="text-sm text-neutral-400">No messages yet.</p>}
      </div>

      <VoiceRecorder
        label="Reply with a voice note"
        onUpload={async (audio) => {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("Not signed in.");

          const ext = extensionForMimeType(audio.mimeType);
          const path = `tasks/${taskAssigneeId}/${crypto.randomUUID()}.${ext}`;
          await uploadMedia(supabase, path, audio.blob, audio.mimeType);

          const { error } = await supabase.from("task_events").insert({
            task_assignee_id: taskAssigneeId,
            author_id: user.id,
            event_type: "voice_note",
            audio_url: path,
          });
          if (error) throw new Error(error.message);

          router.refresh();
        }}
      />
    </div>
  );
}
