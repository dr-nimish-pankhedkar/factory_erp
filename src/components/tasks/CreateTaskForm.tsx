"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Mic, Keyboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/storage";
import { extensionForMimeType } from "@/lib/audio/mime";
import { VoiceCapture } from "@/components/voice/VoiceCapture";
import { CameraCapture } from "@/components/media/CameraCapture";
import type { RecordedAudio } from "@/lib/audio/useVoiceRecorder";

interface StaffOption {
  id: string;
  full_name: string;
  photo_url: string | null;
}

type NoteMode = "voice" | "text";

export function CreateTaskForm({ staff }: { staff: StaffOption[] }) {
  const router = useRouter();
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [noteMode, setNoteMode] = useState<NoteMode>("voice");
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [textNote, setTextNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStaff(id: string) {
    setSelectedStaff((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (noteMode === "voice" && !audio) return setError("Record a voice note describing the task.");
    if (noteMode === "text" && !textNote.trim()) return setError("Type a description of the task.");
    if (selectedStaff.length === 0) return setError("Select at least one staff member.");

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({ created_by: user.id, due_date: dueDate || null })
        .select("id")
        .single();
      if (taskError || !task) throw new Error(taskError?.message ?? "Could not create task.");

      if (photos.length > 0) {
        const paths = await Promise.all(
          photos.map(async (photo) => {
            const path = `task-photos/${task.id}/${crypto.randomUUID()}.jpg`;
            await uploadMedia(supabase, path, photo, photo.type);
            return path;
          }),
        );
        await supabase.from("tasks").update({ photo_urls: paths }).eq("id", task.id);
      }

      for (const staffId of selectedStaff) {
        const { data: assignee, error: assigneeError } = await supabase
          .from("task_assignees")
          .insert({ task_id: task.id, staff_id: staffId })
          .select("id")
          .single();
        if (assigneeError || !assignee) throw new Error(assigneeError?.message ?? "Could not assign staff.");

        if (noteMode === "voice" && audio) {
          const ext = extensionForMimeType(audio.mimeType);
          const audioPath = `tasks/${assignee.id}/${crypto.randomUUID()}.${ext}`;
          await uploadMedia(supabase, audioPath, audio.blob, audio.mimeType);

          const { error: eventError } = await supabase.from("task_events").insert({
            task_assignee_id: assignee.id,
            author_id: user.id,
            event_type: "voice_note",
            audio_url: audioPath,
          });
          if (eventError) throw new Error(eventError.message);
        } else {
          const { error: eventError } = await supabase.from("task_events").insert({
            task_assignee_id: assignee.id,
            author_id: user.id,
            event_type: "text_note",
            content: textNote.trim(),
          });
          if (eventError) throw new Error(eventError.message);
        }
      }

      router.push("/tasks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Assign to</span>
        <div className="flex flex-col gap-2">
          {staff.map((s) => {
            const isSelected = selectedStaff.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStaff(s.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left active:scale-95 ${
                  isSelected ? "border-blue-600 bg-blue-50" : "border-neutral-200 bg-white"
                }`}
              >
                {s.photo_url ? (
                  <Image src={s.photo_url} alt={s.full_name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600">
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-neutral-800">{s.full_name}</span>
              </button>
            );
          })}
          {staff.length === 0 && <p className="text-sm text-neutral-400">No staff accounts yet.</p>}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Due date (optional)</span>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-lg"
        />
      </label>

      <CameraCapture label="Photo (optional, up to 3)" photos={photos} onChange={setPhotos} max={3} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-600">Task description</span>
          <div className="flex rounded-full bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setNoteMode("voice")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                noteMode === "voice" ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500"
              }`}
            >
              <Mic className="h-4 w-4" /> Voice
            </button>
            <button
              type="button"
              onClick={() => setNoteMode("text")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                noteMode === "text" ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500"
              }`}
            >
              <Keyboard className="h-4 w-4" /> Type
            </button>
          </div>
        </div>
        {noteMode === "voice" ? (
          <VoiceCapture audio={audio} onChange={setAudio} />
        ) : (
          <textarea
            value={textNote}
            onChange={(e) => setTextNote(e.target.value)}
            rows={4}
            placeholder="Describe the task..."
            className="rounded-2xl border border-neutral-300 px-4 py-3 text-base"
          />
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="h-16 rounded-2xl bg-blue-600 text-xl font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send task"}
      </button>
    </div>
  );
}
