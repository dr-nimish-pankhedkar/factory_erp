import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { StatusIcon } from "@/components/tasks/StatusIcon";

export default async function TasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  if (profile.role === "staff") {
    const { data: assignments } = await supabase
      .from("task_assignees")
      .select("id, status, task_id, created_at")
      .eq("staff_id", profile.id)
      .order("created_at", { ascending: false });

    const taskIds = [...new Set((assignments ?? []).map((a) => a.task_id))];
    const { data: tasks } =
      taskIds.length > 0 ? await supabase.from("tasks").select("id, due_date, created_by").in("id", taskIds) : { data: [] };
    const taskMap = new Map((tasks ?? []).map((t) => [t.id, t]));

    const creatorIds = [...new Set((tasks ?? []).map((t) => t.created_by))];
    const { data: creators } =
      creatorIds.length > 0
        ? await supabase.from("profiles").select("id, full_name, photo_url").in("id", creatorIds)
        : { data: [] };
    const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));

    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-neutral-800">My Tasks</h1>
        <div className="flex flex-col gap-3">
          {(assignments ?? []).map((a) => {
            const task = taskMap.get(a.task_id);
            const creator = task ? creatorMap.get(task.created_by) : undefined;
            return (
              <Link
                key={a.id}
                href={`/tasks/${a.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.98]"
              >
                {creator?.photo_url ? (
                  <Image src={creator.photo_url} alt={creator.full_name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600">
                    {creator?.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-neutral-800">{creator?.full_name ?? "Unknown"}</span>
                  {task?.due_date && <span className="text-xs text-neutral-400">Due {task.due_date}</span>}
                </div>
                <StatusIcon status={a.status} />
              </Link>
            );
          })}
          {(assignments ?? []).length === 0 && <p className="text-sm text-neutral-400">No tasks yet.</p>}
        </div>
      </div>
    );
  }

  let query = supabase.from("tasks").select("id, title, due_date, created_at, created_by").order("created_at", { ascending: false });
  if (profile.role === "manager") query = query.eq("created_by", profile.id);
  const { data: tasks } = await query;

  const taskIds = (tasks ?? []).map((t) => t.id);
  const { data: assignees } =
    taskIds.length > 0
      ? await supabase.from("task_assignees").select("id, task_id, staff_id, status").in("task_id", taskIds)
      : { data: [] };
  const assigneesByTask = new Map<string, typeof assignees>();
  for (const a of assignees ?? []) {
    const list = assigneesByTask.get(a.task_id) ?? [];
    list.push(a);
    assigneesByTask.set(a.task_id, list);
  }

  const staffIds = [...new Set((assignees ?? []).map((a) => a.staff_id))];
  const { data: staffProfiles } =
    staffIds.length > 0 ? await supabase.from("profiles").select("id, full_name, photo_url").in("id", staffIds) : { data: [] };
  const staffMap = new Map((staffProfiles ?? []).map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800">Tasks</h1>
        <Link href="/tasks/new" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95">
          <Plus className="h-5 w-5" />
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {(tasks ?? []).map((task) => (
          <div key={task.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
            {task.due_date && <span className="text-xs text-neutral-400">Due {task.due_date}</span>}
            <div className="flex flex-wrap gap-2">
              {(assigneesByTask.get(task.id) ?? []).map((a) => {
                const s = staffMap.get(a.staff_id);
                return (
                  <Link
                    key={a.id}
                    href={`/tasks/${a.id}`}
                    className="flex items-center gap-2 rounded-full bg-neutral-100 py-1.5 pl-1.5 pr-3 active:scale-95"
                  >
                    {s?.photo_url ? (
                      <Image src={s.photo_url} alt={s.full_name} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold text-neutral-700">
                        {s?.full_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <span className="text-sm text-neutral-700">{s?.full_name ?? "Unknown"}</span>
                    <StatusIcon status={a.status} className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {(tasks ?? []).length === 0 && <p className="text-sm text-neutral-400">No tasks yet.</p>}
      </div>
    </div>
  );
}
