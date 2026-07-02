"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MaterialCategory } from "@/types/database";

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  raw_material: "Raw material",
  consumable: "Consumable / packaging",
  machine_part: "Machine part",
};

export function CreateItemForm({ defaultCategory }: { defaultCategory?: MaterialCategory }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const category = String(formData.get("category")) as MaterialCategory;

    if (!name || !unit) {
      setError("Name and unit are required.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setPending(false);
      return;
    }

    const { error: insertError } = await supabase.from("materials").insert({
      name,
      default_unit: unit,
      category,
      created_by: user.id,
    });

    if (insertError) {
      setError(insertError.code === "23505" ? "An item with that name already exists." : insertError.message);
      setPending(false);
      return;
    }

    formRef.current?.reset();
    setPending(false);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-700">Add item</h2>
      <input name="name" placeholder="Item name" required className="h-12 rounded-xl border border-neutral-300 px-3 text-base" />
      <input name="unit" placeholder="Unit (kg, pcs, roll...)" required className="h-12 rounded-xl border border-neutral-300 px-3 text-base" />
      <select
        name="category"
        defaultValue={defaultCategory ?? "raw_material"}
        className="h-12 rounded-xl border border-neutral-300 px-3 text-base"
      >
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-blue-600 font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add item"}
      </button>
    </form>
  );
}
