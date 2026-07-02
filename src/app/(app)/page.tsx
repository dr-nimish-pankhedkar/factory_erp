import { ClipboardList, MessageCircleWarning, Truck, Wheat, BarChart3, UserPlus, Package, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { IconTile } from "@/components/layout/IconTile";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  if (profile.role === "staff") {
    const { count: pendingCount } = await supabase
      .from("task_assignees")
      .select("*", { count: "exact", head: true })
      .eq("staff_id", profile.id)
      .neq("status", "done");

    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-neutral-800">Namaste, {profile.full_name}</h1>
        <div className="grid grid-cols-2 gap-3">
          <IconTile href="/tasks" icon={ClipboardList} label="My Tasks" badge={pendingCount ?? 0} color="blue" />
          <IconTile href="/requests/new" icon={MessageCircleWarning} label="Send Request" color="amber" />
        </div>
      </div>
    );
  }

  const { count: openRequestCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .neq("status", "resolved");

  if (profile.role === "manager") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-neutral-800">Welcome, {profile.full_name}</h1>
        <div className="grid grid-cols-2 gap-3">
          <IconTile href="/tasks/new" icon={ClipboardList} label="Assign Task" color="blue" />
          <IconTile href="/requests" icon={MessageCircleWarning} label="Requests" badge={openRequestCount ?? 0} color="amber" />
          <IconTile href="/gate-passes/new" icon={Truck} label="Gate Pass" color="purple" />
          <IconTile href="/intake/new" icon={Wheat} label="Record Intake" color="green" />
          <IconTile href="/consumables" icon={Package} label="Consumables" color="blue" />
        </div>
      </div>
    );
  }

  // Admin
  const { data: stock } = await supabase.from("material_stock").select("*").eq("category", "raw_material");
  const { data: recentPasses } = await supabase
    .from("gate_passes")
    .select("id, item_description, quantity, unit, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-neutral-800">Welcome, {profile.full_name}</h1>

      <div className="grid grid-cols-3 gap-3">
        <IconTile href="/tasks/new" icon={ClipboardList} label="Assign Task" color="blue" />
        <IconTile href="/requests" icon={MessageCircleWarning} label="Requests" badge={openRequestCount ?? 0} color="amber" />
        <IconTile href="/gate-passes/new" icon={Truck} label="Gate Pass" color="purple" />
        <IconTile href="/intake/new" icon={Wheat} label="Record Intake" color="green" />
        <IconTile href="/intake" icon={BarChart3} label="Stock" color="blue" />
        <IconTile href="/consumables" icon={Package} label="Consumables" color="blue" />
        <IconTile href="/accounts" icon={UserPlus} label="Accounts" color="purple" />
        <IconTile href="/items" icon={Settings} label="Items" color="amber" />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-500">Current stock</h2>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          {stock?.length ? (
            stock.map((row) => (
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
        <h2 className="text-sm font-semibold text-neutral-500">Recent gate passes</h2>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
          {recentPasses?.length ? (
            recentPasses.map((pass) => (
              <div key={pass.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{pass.item_description}</span>
                <span className="font-semibold text-neutral-900">
                  {pass.quantity} {pass.unit}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No gate passes yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
