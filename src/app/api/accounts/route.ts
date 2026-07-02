import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/current-profile";
import { normalizeUsername, isValidUsername, usernameToAuthEmail } from "@/lib/username";
import type { UserRole } from "@/types/database";

export async function POST(request: Request) {
  const actor = await getCurrentProfile();
  if (!actor || !actor.is_active) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const role = body.role as UserRole;
  const fullName = String(body.full_name ?? "").trim();
  const username = normalizeUsername(String(body.username ?? ""));
  const phone = String(body.phone ?? "").trim() || null;
  const pin = String(body.pin ?? "");

  if (!fullName || !isValidUsername(username) || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json(
      { error: "Name, a username (3-30 letters/numbers), and a 4-6 digit PIN are required." },
      { status: 400 },
    );
  }
  if (actor.role === "manager" && role !== "staff") {
    return NextResponse.json({ error: "Managers can only create Staff accounts." }, { status: 403 });
  }
  if (actor.role === "staff") {
    return NextResponse.json({ error: "Staff cannot create accounts." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: usernameToAuthEmail(username),
    password: pin,
    email_confirm: true,
  });
  if (createError || !created.user) {
    const message = createError?.message.includes("already been registered")
      ? "That username is already taken."
      : (createError?.message ?? "Could not create account.");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    username,
    phone,
    role,
    created_by: actor.id,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    const message = profileError.code === "23505" ? "That username is already taken." : profileError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
