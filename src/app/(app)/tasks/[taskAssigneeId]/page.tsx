import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { signedMediaUrl } from "@/lib/storage";
import { TaskThread, type ThreadEvent } from "@/components/tasks/TaskThread";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskAssigneeId: string }>;
}) {
  const { taskAssigneeId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("task_assignees")
    .select("id, task_id, staff_id, status")
    .eq("id", taskAssigneeId)
    .single();
  if (!assignment) notFound();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, photo_url, due_date")
    .eq("id", assignment.task_id)
    .single();

  const { data: events } = await supabase
    .from("task_events")
    .select("id, event_type, audio_url, content, status_from, status_to, author_id, created_at")
    .eq("task_assignee_id", taskAssigneeId)
    .order("created_at", { ascending: true });

  const authorIds = [...new Set((events ?? []).map((e) => e.author_id))];
  const { data: authors } =
    authorIds.length > 0 ? await supabase.from("profiles").select("id, full_name, photo_url").in("id", authorIds) : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  const threadEvents: ThreadEvent[] = await Promise.all(
    (events ?? []).map(async (e) => {
      const author = authorMap.get(e.author_id);
      return {
        id: e.id,
        event_type: e.event_type,
        audioUrl: e.audio_url ? await signedMediaUrl(supabase, e.audio_url) : null,
        content: e.content,
        statusFrom: e.status_from,
        statusTo: e.status_to,
        createdAt: e.created_at,
        authorName: author?.full_name ?? "Unknown",
        authorPhotoUrl: author?.photo_url ?? null,
      };
    }),
  );

  const photoUrl = task?.photo_url ? await signedMediaUrl(supabase, task.photo_url) : null;
  const canUpdateStatus = assignment.staff_id === profile.id;

  return (
    <div className="flex flex-col gap-4">
      {photoUrl && (
        <Image
          src={photoUrl}
          alt="Task reference"
          width={600}
          height={400}
          className="w-full rounded-2xl object-cover"
        />
      )}
      {task?.due_date && <p className="text-sm text-neutral-500">Due {task.due_date}</p>}
      <TaskThread
        taskAssigneeId={assignment.id}
        currentStatus={assignment.status}
        canUpdateStatus={canUpdateStatus}
        initialEvents={threadEvents}
      />
    </div>
  );
}
