"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mic, Keyboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/storage";
import { extensionForMimeType } from "@/lib/audio/mime";
import { VoiceCapture } from "@/components/voice/VoiceCapture";
import { CategoryIcon, CATEGORY_CONFIG } from "./CategoryIcon";
import type { RecordedAudio } from "@/lib/audio/useVoiceRecorder";
import type { RequestCategory } from "@/types/database";

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as RequestCategory[];

interface ManagerOption {
  id: string;
  full_name: string;
}

type NoteMode = "voice" | "text";

export function CreateRequestForm({ managers }: { managers: ManagerOption[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<RequestCategory>("other");
  const [managerId, setManagerId] = useState<string>("");
  const [noteMode, setNoteMode] = useState<NoteMode>("voice");
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [textNote, setTextNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (noteMode === "voice" && !audio) return setError("Record a voice note describing the issue.");
    if (noteMode === "text" && !textNote.trim()) return setError("Type a description of the issue.");

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data: request, error: requestError } = await supabase
        .from("requests")
        .insert({ staff_id: user.id, manager_id: managerId || null, category })
        .select("id")
        .single();
      if (requestError || !request) throw new Error(requestError?.message ?? "Could not send request.");

      if (noteMode === "voice" && audio) {
        const ext = extensionForMimeType(audio.mimeType);
        const path = `requests/${request.id}/${crypto.randomUUID()}.${ext}`;
        await uploadMedia(supabase, path, audio.blob, audio.mimeType);

        const { error: eventError } = await supabase.from("request_events").insert({
          request_id: request.id,
          author_id: user.id,
          audio_url: path,
        });
        if (eventError) throw new Error(eventError.message);
      } else {
        const { error: eventError } = await supabase.from("request_events").insert({
          request_id: request.id,
          author_id: user.id,
          content: textNote.trim(),
        });
        if (eventError) throw new Error(eventError.message);
      }

      router.push("/requests");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">What&apos;s this about?</span>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`flex flex-col items-center gap-1 rounded-2xl p-2 ${
                category === c ? "bg-blue-50 ring-2 ring-blue-600" : ""
              }`}
            >
              <CategoryIcon category={c} />
              <span className="text-center text-[11px] text-neutral-600">{CATEGORY_CONFIG[c].label}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Send to</span>
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        >
          <option value="">Any available manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-600">Describe the issue</span>
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
            placeholder="Describe the issue..."
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
        {submitting ? "Sending..." : "Send request"}
      </button>
    </div>
  );
}
