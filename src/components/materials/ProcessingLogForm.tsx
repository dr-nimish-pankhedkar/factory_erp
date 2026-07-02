"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MaterialOption {
  id: string;
  name: string;
  default_unit: string;
}

export function ProcessingLogForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [inputMaterialId, setInputMaterialId] = useState(materials[0]?.id ?? "");
  const [inputQuantity, setInputQuantity] = useState("");
  const [outputMaterialId, setOutputMaterialId] = useState(materials[1]?.id ?? materials[0]?.id ?? "");
  const [outputQuantity, setOutputQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!inputMaterialId || !outputMaterialId || !inputQuantity || !outputQuantity) {
      return setError("Fill in both materials and quantities.");
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error: insertError } = await supabase.from("processing_log").insert({
        input_material_id: inputMaterialId,
        input_quantity: Number(inputQuantity),
        output_material_id: outputMaterialId,
        output_quantity: Number(outputQuantity),
        processed_by: user.id,
        notes: notes || null,
      });
      if (insertError) throw new Error(insertError.message);

      router.push("/intake");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Raw material used</span>
        <select
          value={inputMaterialId}
          onChange={(e) => setInputMaterialId(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Quantity used</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={inputQuantity}
          onChange={(e) => setInputQuantity(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Finished material produced</span>
        <select
          value={outputMaterialId}
          onChange={(e) => setOutputMaterialId(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Quantity produced</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={outputQuantity}
          onChange={(e) => setOutputQuantity(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Notes (optional)</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="h-16 rounded-2xl bg-blue-600 text-xl font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Log processing"}
      </button>
    </div>
  );
}
