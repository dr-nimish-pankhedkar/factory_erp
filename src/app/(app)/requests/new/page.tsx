import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { CreateRequestForm } from "@/components/requests/CreateRequestForm";

export default async function NewRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "staff") redirect("/requests");

  const supabase = await createClient();
  const { data: managers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "manager")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Send a request</h1>
      <CreateRequestForm managers={managers ?? []} />
    </div>
  );
}
