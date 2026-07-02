import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ExportCsvButton } from "@/components/materials/ExportCsvButton";

export default async function ConsumablesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const [{ data: stock }, { data: movements }] = await Promise.all([
    supabase.from("material_stock").select("*").in("category", ["consumable", "machine_part"]).order("name"),
    supabase
      .from("consumable_stock_movements")
      .select("id, material_id, direction, quantity, reason, recorded_by, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(30),
  ]);

  const materialIds = [...new Set((movements ?? []).map((m) => m.material_id))];
  const recorderIds = [...new Set((movements ?? []).map((m) => m.recorded_by))];
  const [{ data: materials }, { data: recorders }] = await Promise.all([
    materialIds.length > 0
      ? supabase.from("materials").select("id, name").in("id", materialIds)
      : Promise.resolve({ data: [] }),
    recorderIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", recorderIds)
      : Promise.resolve({ data: [] }),
  ]);
  const materialMap = new Map((materials ?? []).map((m) => [m.id, m.name]));
  const recorderMap = new Map((recorders ?? []).map((p) => [p.id, p.full_name]));

  const csvRows = (movements ?? []).map((m) => ({
    item: materialMap.get(m.material_id) ?? "",
    direction: m.direction,
    quantity: m.quantity,
    reason: m.reason ?? "",
    recorded_by: recorderMap.get(m.recorded_by) ?? "",
    recorded_at: m.recorded_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800">Consumables</h1>
        <div className="flex items-center gap-2">
          {profile.role === "admin" && (
            <Link
              href="/items"
              className="flex h-11 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-sm font-medium text-neutral-700 active:scale-95"
            >
              <Settings className="h-4 w-4" /> Items
            </Link>
          )}
          <Link href="/consumables/new" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95">
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-500">Current stock</h2>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          {(stock ?? []).length ? (
            (stock ?? []).map((row) => (
              <div key={row.material_id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{row.name}</span>
                <span className="font-semibold text-neutral-900">
                  {row.current_stock} {row.default_unit}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">
              No consumable items yet.{" "}
              {profile.role === "admin" && (
                <Link href="/items" className="text-blue-600 underline">
                  Add one
                </Link>
              )}
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500">Recent movements</h2>
          <ExportCsvButton rows={csvRows} filename="consumable-movements.csv" />
        </div>
        <div className="flex flex-col gap-3">
          {(movements ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-col">
                <span className="font-medium text-neutral-800">{materialMap.get(m.material_id) ?? "Unknown"}</span>
                <span className="text-xs text-neutral-400">
                  {m.reason ?? "—"} · {recorderMap.get(m.recorded_by) ?? "Unknown"} · {m.recorded_at}
                </span>
              </div>
              <span className={`font-semibold ${m.direction === "in" ? "text-green-600" : "text-red-600"}`}>
                {m.direction === "in" ? "+" : "-"}
                {m.quantity}
              </span>
            </div>
          ))}
          {(movements ?? []).length === 0 && <p className="text-sm text-neutral-400">No movements recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
