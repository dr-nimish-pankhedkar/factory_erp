import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/current-profile";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const actor = await getCurrentProfile();
  if (!actor || actor.role === "staff") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const isActive = Boolean(body.is_active);

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
