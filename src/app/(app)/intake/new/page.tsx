import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { IntakeForm } from "@/components/materials/IntakeForm";

export default async function NewIntakePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const { data: materials } = await supabase.from("materials").select("id, name, default_unit").order("name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Record material intake</h1>
      <IntakeForm materials={materials ?? []} />
    </div>
  );
}
