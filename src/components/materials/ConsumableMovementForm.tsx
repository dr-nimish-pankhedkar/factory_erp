"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StockDirection } from "@/types/database";

interface ItemOption {
  id: string;
  name: string;
  default_unit: string;
}

export function ConsumableMovementForm({ items }: { items: ItemOption[] }) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState(items[0]?.id ?? "");
  const [direction, setDirection] = useState<StockDirection>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unit = items.find((i) => i.id === materialId)?.default_unit ?? "";

  async function handleSubmit() {
    if (!materialId || !quantity) return setError("Select an item and enter a quantity.");
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error: insertError } = await supabase.from("consumable_stock_movements").insert({
        material_id: materialId,
        direction,
        quantity: Number(quantity),
        reason: reason || null,
        recorded_by: user.id,
      });
      if (insertError) throw new Error(insertError.message);

      router.push("/consumables");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Item</span>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        >
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        {items.length === 0 && (
          <p className="text-sm text-neutral-400">No consumable items yet — add one under Items first.</p>
        )}
      </label>

      <div className="flex gap-2 rounded-2xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setDirection("in")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${direction === "in" ? "bg-white text-green-700 shadow-sm" : "text-neutral-500"}`}
        >
          Stock in
        </button>
        <button
          type="button"
          onClick={() => setDirection("out")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${direction === "out" ? "bg-white text-red-700 shadow-sm" : "text-neutral-500"}`}
        >
          Used / stock out
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Quantity {unit && `(${unit})`}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">Reason / note (optional)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={direction === "in" ? "e.g. purchased from vendor" : "e.g. used for packing order"}
          className="h-14 rounded-2xl border border-neutral-300 px-4 text-base"
        />
      </label>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || items.length === 0}
        className="h-16 rounded-2xl bg-blue-600 text-xl font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Record"}
      </button>
    </div>
  );
}
