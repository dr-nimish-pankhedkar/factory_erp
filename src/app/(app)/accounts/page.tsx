import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { CreateAccountForm } from "@/components/accounts/CreateAccountForm";
import { AccountRow } from "@/components/accounts/AccountRow";
import type { UserRole } from "@/types/database";

export default async function AccountsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "staff") redirect("/");

  const supabase = await createClient();
  const { data: accounts } = await supabase.from("profiles").select("*").order("role").order("full_name");

  const allowedRoles: UserRole[] = profile.role === "admin" ? ["staff", "manager", "admin"] : ["staff"];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-neutral-800">Accounts</h1>
      <CreateAccountForm allowedRoles={allowedRoles} />
      <div className="flex flex-col gap-2">
        {(accounts ?? []).map((a) => {
          const canManage = profile.role === "admin" || (profile.role === "manager" && a.role === "staff") || a.id === profile.id;
          return <AccountRow key={a.id} account={a} canManage={canManage} />;
        })}
      </div>
    </div>
  );
}
