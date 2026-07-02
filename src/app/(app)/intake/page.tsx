import Link from "next/link";
import { Plus, Factory } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ExportCsvButton } from "@/components/materials/ExportCsvButton";

export default async function IntakePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const [{ data: stock }, { data: intakes }] = await Promise.all([
    supabase.from("material_stock").select("*"),
    supabase
      .from("material_intake")
      .select("id, material_id, quantity, unit, source_vendor, entered_by, received_at")
      .order("received_at", { ascending: false })
      .limit(20),
  ]);

  const materialIds = [...new Set((intakes ?? []).map((i) => i.material_id))];
  const enteredByIds = [...new Set((intakes ?? []).map((i) => i.entered_by))];
  const [{ data: materials }, { data: enteredByProfiles }] = await Promise.all([
    materialIds.length > 0
      ? supabase.from("materials").select("id, name").in("id", materialIds)
      : Promise.resolve({ data: [] }),
    enteredByIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", enteredByIds)
      : Promise.resolve({ data: [] }),
  ]);
  const materialMap = new Map((materials ?? []).map((m) => [m.id, m.name]));
  const enteredByMap = new Map((enteredByProfiles ?? []).map((p) => [p.id, p.full_name]));

  const csvRows = (intakes ?? []).map((i) => ({
    material: materialMap.get(i.material_id) ?? "",
    quantity: i.quantity,
    unit: i.unit,
    source_vendor: i.source_vendor ?? "",
    entered_by: enteredByMap.get(i.entered_by) ?? "",
    received_at: i.received_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800">Materials</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/intake/process"
            className="flex h-11 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-sm font-medium text-neutral-700 active:scale-95"
          >
            <Factory className="h-4 w-4" /> Log processing
          </Link>
          <Link href="/intake/new" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95">
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
            <p className="text-sm text-neutral-400">No stock data yet.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500">Recent intake</h2>
          <ExportCsvButton rows={csvRows} filename="material-intake.csv" />
        </div>
        <div className="flex flex-col gap-3">
          {(intakes ?? []).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-col">
                <span className="font-medium text-neutral-800">{materialMap.get(i.material_id) ?? "Unknown"}</span>
                <span className="text-xs text-neutral-400">
                  {i.source_vendor ?? "—"} · {enteredByMap.get(i.entered_by) ?? "Unknown"} · {i.received_at}
                </span>
              </div>
              <span className="font-semibold text-neutral-900">
                {i.quantity} {i.unit}
              </span>
            </div>
          ))}
          {(intakes ?? []).length === 0 && <p className="text-sm text-neutral-400">No intake recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
