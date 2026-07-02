import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { CreateItemForm } from "@/components/materials/CreateItemForm";
import { ItemRow } from "@/components/materials/ItemRow";

export default async function ItemsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: items } = await supabase.from("materials").select("*").order("category").order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Items</h1>
      <p className="text-sm text-neutral-500">
        Manage raw materials, packaging consumables, and machine parts tracked across the app.
      </p>
      <CreateItemForm />
      <div className="flex flex-col gap-2">
        {(items ?? []).map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
        {(items ?? []).length === 0 && <p className="text-sm text-neutral-400">No items yet.</p>}
      </div>
    </div>
  );
}
