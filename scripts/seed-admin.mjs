// One-time bootstrap: creates an Admin account directly via the service-role
// key. Needed because normal account creation requires an existing Admin to
// be signed in — but the very first Admin has to come from somewhere.
//
// Usage:
//   node scripts/seed-admin.mjs "Full Name" username 123456
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const [fullName, usernameArg, pin] = process.argv.slice(2);
if (!fullName || !usernameArg || !pin) {
  console.error('Usage: node scripts/seed-admin.mjs "Full Name" username 123456');
  process.exit(1);
}
if (!/^\d{4,6}$/.test(pin)) {
  console.error("PIN must be 4-6 digits.");
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const username = usernameArg.trim().toLowerCase();
const email = `${username}@users.millapp.internal`;

const { count } = await admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin");
if ((count ?? 0) >= 2) {
  console.error("Both Admin seats are already filled. Use the in-app account management instead.");
  process.exit(1);
}

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password: pin,
  email_confirm: true,
});
if (createError) {
  console.error("Failed to create auth user:", createError.message);
  process.exit(1);
}

const { error: profileError } = await admin.from("profiles").insert({
  id: created.user.id,
  full_name: fullName,
  username,
  role: "admin",
});
if (profileError) {
  await admin.auth.admin.deleteUser(created.user.id);
  console.error("Failed to create profile:", profileError.message);
  process.exit(1);
}

console.log(`Admin account created. Sign in with username "${username}" and your PIN.`);
