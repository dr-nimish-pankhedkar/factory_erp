import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { CategoryIcon } from "@/components/requests/CategoryIcon";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  acknowledged: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
};

export default async function RequestsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  let query = supabase
    .from("requests")
    .select("id, category, status, staff_id, created_at")
    .order("created_at", { ascending: false });
  if (profile.role === "staff") query = query.eq("staff_id", profile.id);
  const { data: requests } = await query;

  const staffIds = [...new Set((requests ?? []).map((r) => r.staff_id))];
  const { data: staffProfiles } =
    staffIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", staffIds) : { data: [] };
  const staffMap = new Map((staffProfiles ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800">Requests</h1>
        {profile.role === "staff" && (
          <Link href="/requests/new" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95">
            <Plus className="h-5 w-5" />
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {(requests ?? []).map((r) => (
          <Link key={r.id} href={`/requests/${r.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.98]">
            <CategoryIcon category={r.category} />
            <div className="flex flex-1 flex-col">
              <span className="font-medium text-neutral-800">{staffMap.get(r.staff_id) ?? "Unknown"}</span>
              <span className="text-xs text-neutral-400">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>{r.status}</span>
          </Link>
        ))}
        {(requests ?? []).length === 0 && <p className="text-sm text-neutral-400">No requests yet.</p>}
      </div>
    </div>
  );
}
