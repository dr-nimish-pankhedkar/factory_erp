"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Material = Database["public"]["Tables"]["materials"]["Row"];

const CATEGORY_STYLES: Record<string, string> = {
  raw_material: "bg-green-100 text-green-700",
  consumable: "bg-blue-100 text-blue-700",
  machine_part: "bg-purple-100 text-purple-700",
};

export function ItemRow({ item }: { item: Material }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    const supabase = createClient();
    await supabase.from("materials").update({ is_active: !item.is_active }).eq("id", item.id);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex flex-1 flex-col">
        <span className={`font-medium ${item.is_active ? "text-neutral-800" : "text-neutral-400 line-through"}`}>
          {item.name}
        </span>
        <span className="text-xs text-neutral-400">{item.default_unit}</span>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLES[item.category]}`}>
        {item.category.replace("_", " ")}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="h-9 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-700 active:scale-95 disabled:opacity-50"
      >
        {item.is_active ? "Deactivate" : "Reactivate"}
      </button>
    </div>
  );
}
