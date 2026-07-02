import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/current-profile";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const actor = await getCurrentProfile();
  if (!actor || !actor.is_active) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const pin = String(body.pin ?? "");
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "Enter a 4-6 digit PIN." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("id, role").eq("id", userId).single();
  if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (actor.role === "manager" && target.role !== "staff") {
    return NextResponse.json({ error: "Managers can only reset Staff PINs." }, { status: 403 });
  }
  if (actor.role === "staff" && userId !== actor.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: pin });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
