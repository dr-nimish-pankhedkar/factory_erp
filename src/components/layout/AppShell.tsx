import Image from "next/image";
import Link from "next/link";
import { UserCog, LogOut } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { BottomNav } from "./BottomNav";
import { signOut } from "@/lib/actions/auth";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          {profile.photo_url ? (
            <Image
              src={profile.photo_url}
              alt={profile.full_name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-800">{profile.full_name}</span>
            <RoleBadge role={profile.role} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {profile.role !== "staff" && (
            <Link
              href="/accounts"
              aria-label="Manage accounts"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100"
            >
              <UserCog className="h-5 w-5" />
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>

      <BottomNav role={profile.role} />
    </div>
  );
}
