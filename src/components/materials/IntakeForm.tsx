"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/storage";

interface MaterialOption {
  id: string;
  name: string;
  default_unit: string;
}

export function IntakeForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(materials[0]?.default_unit ?? "");
  const [sourceVendor, setSourceVendor] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleMaterialChange(id: string) {
    setMaterialId(id);
    const material = materials.find((m) => m.id === id);
    if (material) setUnit(material.default_unit);
  }

  async function handleSubmit() {
    if (!materialId || !quantity || !unit) return setError("Fill in material, quantity, and unit.");
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data: intake, error: insertError } = await supabase
        .from("material_intake")
        .insert({
          material_id: materialId,
          quantity: Number(quantity),
          unit,
          source_vendor: sourceVendor || null,
          entered_by: user.id,
        })
        .select("id")
        .single();
      if (insertError || !intake) throw new Error(insertError?.message ?? "Could not record intake.");

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `intake/${intake.id}/${crypto.randomUUID()}.${ext}`;
        await uploadMedia(supabase, path, photoFile, photoFile.type);
        await supabase.from("material_intake").update({ photo_url: path }).eq("id", intake.id);
      }

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
        <span className="text-sm font-medium text-neutral-600">Material</span>
        <select
          value={materialId}
          onChange={(e) => handleMaterialChange(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-neutral-600">Quantity</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-neutral-600">Unit</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Source / vendor (optional)</span>
        <input
          value={sourceVendor}
          onChange={(e) => setSourceVendor(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Weighbridge slip photo (optional)</span>
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

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="h-16 rounded-2xl bg-blue-600 text-xl font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Record intake"}
      </button>
    </div>
  );
}
