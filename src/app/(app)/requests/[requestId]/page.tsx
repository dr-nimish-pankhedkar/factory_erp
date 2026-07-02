import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { signedMediaUrl } from "@/lib/storage";
import { RequestThread, type RequestThreadEvent } from "@/components/requests/RequestThread";
import { CategoryIcon, CATEGORY_CONFIG } from "@/components/requests/CategoryIcon";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("id, category, status, staff_id, manager_id")
    .eq("id", requestId)
    .single();
  if (!request) notFound();

  const { data: events } = await supabase
    .from("request_events")
    .select("id, audio_url, status_from, status_to, author_id, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const authorIds = [...new Set((events ?? []).map((e) => e.author_id))];
  const { data: authors } =
    authorIds.length > 0 ? await supabase.from("profiles").select("id, full_name, photo_url").in("id", authorIds) : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  const threadEvents: RequestThreadEvent[] = await Promise.all(
    (events ?? []).map(async (e) => {
      const author = authorMap.get(e.author_id);
      return {
        id: e.id,
        audioUrl: e.audio_url ? await signedMediaUrl(supabase, e.audio_url) : null,
        statusFrom: e.status_from,
        statusTo: e.status_to,
        createdAt: e.created_at,
        authorName: author?.full_name ?? "Unknown",
        authorPhotoUrl: author?.photo_url ?? null,
      };
    }),
  );

  const canManage = profile.role === "admin" || profile.role === "manager";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CategoryIcon category={request.category} />
        <span className="font-medium text-neutral-800">{CATEGORY_CONFIG[request.category].label}</span>
      </div>
      <RequestThread
        requestId={request.id}
        currentStatus={request.status}
        canManage={canManage}
        currentUserId={profile.id}
        managerId={request.manager_id}
        initialEvents={threadEvents}
      />
    </div>
  );
}
