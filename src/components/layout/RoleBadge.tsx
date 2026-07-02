import type { UserRole } from "@/types/database";

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
