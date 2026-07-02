"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/storage";
import { extensionForMimeType } from "@/lib/audio/mime";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { VoiceMessagePlayer } from "@/components/voice/VoiceMessagePlayer";
import type { RequestStatus } from "@/types/database";

export interface RequestThreadEvent {
  id: string;
  audioUrl: string | null;
  statusFrom: RequestStatus | null;
  statusTo: RequestStatus | null;
  createdAt: string;
  authorName: string;
  authorPhotoUrl: string | null;
}

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

export function RequestThread({
  requestId,
  currentStatus,
  canManage,
  currentUserId,
  managerId,
  initialEvents,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  canManage: boolean;
  currentUserId: string;
  managerId: string | null;
  initialEvents: RequestThreadEvent[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(next: RequestStatus) {
    setUpdating(true);
    const supabase = createClient();

    const update: { status: RequestStatus; manager_id?: string } = { status: next };
    if (!managerId) update.manager_id = currentUserId;

    await supabase.from("requests").update(update).eq("id", requestId);
    await supabase.from("request_events").insert({
      request_id: requestId,
      author_id: currentUserId,
      status_from: status,
      status_to: next,
    });

    setStatus(next);
    setUpdating(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              disabled={updating}
              className={`flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-50 ${
                status === opt.value ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {initialEvents.map((event) =>
          event.audioUrl ? (
            <VoiceMessagePlayer
              key={event.id}
              src={event.audioUrl}
              authorName={event.authorName}
              authorPhotoUrl={event.authorPhotoUrl ?? undefined}
              timestamp={new Date(event.createdAt).toLocaleString()}
            />
          ) : (
            <p key={event.id} className="self-center rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500">
              {event.authorName} marked {event.statusTo}
            </p>
          ),
        )}
        {initialEvents.length === 0 && <p className="text-sm text-neutral-400">No messages yet.</p>}
      </div>

      <VoiceRecorder
        label="Reply with a voice note"
        onUpload={async (audio) => {
          const supabase = createClient();
          const ext = extensionForMimeType(audio.mimeType);
          const path = `requests/${requestId}/${crypto.randomUUID()}.${ext}`;
          await uploadMedia(supabase, path, audio.blob, audio.mimeType);

          const { error } = await supabase.from("request_events").insert({
            request_id: requestId,
            author_id: currentUserId,
            audio_url: path,
          });
          if (error) throw new Error(error.message);

          router.refresh();
        }}
      />
    </div>
  );
}
