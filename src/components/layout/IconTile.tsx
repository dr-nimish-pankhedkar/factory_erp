import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const COLOR_STYLES = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  purple: "bg-purple-50 text-purple-700",
  red: "bg-red-50 text-red-700",
} as const;

export interface IconTileProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  color?: keyof typeof COLOR_STYLES;
}

export function IconTile({ href, icon: Icon, label, badge, color = "blue" }: IconTileProps) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl p-5 text-center active:scale-95 ${COLOR_STYLES[color]}`}
    >
      {!!badge && (
        <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
      <Icon className="h-8 w-8" />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}
