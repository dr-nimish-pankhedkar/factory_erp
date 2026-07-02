import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";

export default async function NewTaskPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/tasks");

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, photo_url")
    .eq("role", "staff")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Assign a task</h1>
      <CreateTaskForm staff={staff ?? []} />
    </div>
  );
}
