import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ConsumableMovementForm } from "@/components/materials/ConsumableMovementForm";

export default async function NewConsumableMovementPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("materials")
    .select("id, name, default_unit")
    .in("category", ["consumable", "machine_part"])
    .eq("is_active", true)
    .order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Consumable stock movement</h1>
      <ConsumableMovementForm items={items ?? []} />
    </div>
  );
}
