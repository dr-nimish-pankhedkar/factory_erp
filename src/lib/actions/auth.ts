"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername, usernameToAuthEmail } from "@/lib/username";

export interface SignInState {
  error?: string;
}

export async function signInWithPin(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const pin = String(formData.get("pin") ?? "");

  if (!username || !/^\d{4,6}$/.test(pin)) {
    return { error: "Enter your username and PIN." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToAuthEmail(username),
    password: pin,
  });

  if (error) {
    return { error: "Username or PIN is incorrect." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
