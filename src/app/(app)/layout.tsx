import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");

  return <AppShell profile={profile}>{children}</AppShell>;
}
