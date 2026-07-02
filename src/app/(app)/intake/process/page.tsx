import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { ProcessingLogForm } from "@/components/materials/ProcessingLogForm";

export default async function ProcessingLogPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const { data: materials } = await supabase
    .from("materials")
    .select("id, name, default_unit")
    .eq("category", "raw_material")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Log processing</h1>
      <ProcessingLogForm materials={materials ?? []} />
    </div>
  );
}
