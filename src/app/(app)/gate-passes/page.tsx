import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { QrCode } from "@/components/materials/QrCode";
import { ExportCsvButton } from "@/components/materials/ExportCsvButton";

export default async function GatePassesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const { data: passes } = await supabase
    .from("gate_passes")
    .select("id, pass_code, item_description, quantity, unit, vendor_or_vehicle, reason, raised_by, created_at")
    .order("created_at", { ascending: false });

  const raiserIds = [...new Set((passes ?? []).map((p) => p.raised_by))];
  const { data: raisers } =
    raiserIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", raiserIds) : { data: [] };
  const raiserMap = new Map((raisers ?? []).map((r) => [r.id, r.full_name]));

  const csvRows = (passes ?? []).map((p) => ({
    pass_code: p.pass_code,
    item: p.item_description,
    quantity: p.quantity,
    unit: p.unit,
    vendor_or_vehicle: p.vendor_or_vehicle ?? "",
    reason: p.reason,
    raised_by: raiserMap.get(p.raised_by) ?? "",
    created_at: p.created_at,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800">Gate Passes</h1>
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={csvRows} filename="gate-passes.csv" />
          <Link href="/gate-passes/new" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95">
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {(passes ?? []).map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <QrCode value={p.pass_code} size={72} />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-mono text-xs text-neutral-400">{p.pass_code}</span>
              <span className="font-medium text-neutral-800">{p.item_description}</span>
              <span className="text-sm text-neutral-600">
                {p.quantity} {p.unit}
                {p.vendor_or_vehicle ? ` · ${p.vendor_or_vehicle}` : ""}
              </span>
              <span className="text-xs text-neutral-400">
                {raiserMap.get(p.raised_by) ?? "Unknown"} · {new Date(p.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {(passes ?? []).length === 0 && <p className="text-sm text-neutral-400">No gate passes yet.</p>}
      </div>
    </div>
  );
}
