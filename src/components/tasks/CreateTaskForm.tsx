"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/storage";
import { extensionForMimeType } from "@/lib/audio/mime";
import { VoiceCapture } from "@/components/voice/VoiceCapture";
import type { RecordedAudio } from "@/lib/audio/useVoiceRecorder";

interface StaffOption {
  id: string;
  full_name: string;
  photo_url: string | null;
}

export function CreateTaskForm({ staff }: { staff: StaffOption[] }) {
  const router = useRouter();
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStaff(id: string) {
    setSelectedStaff((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (!audio) return setError("Record a voice note describing the task.");
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

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `task-photos/${task.id}/${crypto.randomUUID()}.${ext}`;
        await uploadMedia(supabase, path, photoFile, photoFile.type);
        await supabase.from("tasks").update({ photo_url: path }).eq("id", task.id);
      }

      for (const staffId of selectedStaff) {
        const { data: assignee, error: assigneeError } = await supabase
          .from("task_assignees")
          .insert({ task_id: task.id, staff_id: staffId })
          .select("id")
          .single();
        if (assigneeError || !assignee) throw new Error(assigneeError?.message ?? "Could not assign staff.");

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

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Photo (optional)</span>
        <label className="flex h-14 w-fit cursor-pointer items-center gap-2 rounded-2xl bg-neutral-100 px-4 text-sm font-medium text-neutral-700">
          <Camera className="h-5 w-5" />
          {photoFile ? photoFile.name : "Add photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Voice note</span>
        <VoiceCapture audio={audio} onChange={setAudio} />
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
