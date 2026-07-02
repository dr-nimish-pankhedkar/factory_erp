"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generatePassCode } from "@/lib/passcode";

interface MaterialOption {
  id: string;
  name: string;
  default_unit: string;
}

export function GatePassForm({ materials }: { materials: MaterialOption[] }) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [vendorOrVehicle, setVendorOrVehicle] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleMaterialChange(id: string) {
    setMaterialId(id);
    const material = materials.find((m) => m.id === id);
    if (material) {
      setItemDescription(material.name);
      setUnit(material.default_unit);
    }
  }

  async function handleSubmit() {
    if (!itemDescription || !quantity || !unit || !reason) {
      return setError("Fill in item, quantity, unit, and reason.");
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error: insertError } = await supabase.from("gate_passes").insert({
        pass_code: generatePassCode(),
        raised_by: user.id,
        material_id: materialId || null,
        item_description: itemDescription,
        quantity: Number(quantity),
        unit,
        vendor_or_vehicle: vendorOrVehicle || null,
        reason,
      });
      if (insertError) throw new Error(insertError.message);

      router.push("/gate-passes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Material (optional, for stock tracking)</span>
        <select
          value={materialId}
          onChange={(e) => handleMaterialChange(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        >
          <option value="">Other item</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Item description</span>
        <input
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
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
        <span className="text-sm font-medium text-neutral-600">Vendor / vehicle (optional)</span>
        <input
          value={vendorOrVehicle}
          onChange={(e) => setVendorOrVehicle(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Reason for exit</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-2xl border border-neutral-300 px-4 py-3 text-base"
        />
      </label>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="h-16 rounded-2xl bg-blue-600 text-xl font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create gate pass"}
      </button>
    </div>
  );
}
