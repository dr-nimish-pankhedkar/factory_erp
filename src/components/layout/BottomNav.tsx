"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, MessageCircleWarning, Truck, Wheat } from "lucide-react";
import type { UserRole } from "@/types/database";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, roles: ["admin", "manager", "staff"] as UserRole[] },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, roles: ["admin", "manager", "staff"] as UserRole[] },
  {
    href: "/requests",
    label: "Requests",
    icon: MessageCircleWarning,
    roles: ["admin", "manager", "staff"] as UserRole[],
  },
  { href: "/gate-passes", label: "Gate Pass", icon: Truck, roles: ["admin", "manager"] as UserRole[] },
  { href: "/intake", label: "Materials", icon: Wheat, roles: ["admin", "manager"] as UserRole[] },
];

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${
              isActive ? "text-blue-600" : "text-neutral-400"
            }`}
          >
            <Icon className="h-6 w-6" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
