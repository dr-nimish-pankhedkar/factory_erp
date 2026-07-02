import { Wrench, PackageX, ShieldAlert, HelpCircle } from "lucide-react";
import type { RequestCategory } from "@/types/database";

const CATEGORY_CONFIG: Record<RequestCategory, { icon: typeof Wrench; color: string; label: string }> = {
  machine_issue: { icon: Wrench, color: "text-red-600 bg-red-50", label: "Machine issue" },
  material_shortage: { icon: PackageX, color: "text-amber-600 bg-amber-50", label: "Material shortage" },
  safety: { icon: ShieldAlert, color: "text-purple-600 bg-purple-50", label: "Safety" },
  other: { icon: HelpCircle, color: "text-neutral-600 bg-neutral-100", label: "Other" },
};

export function CategoryIcon({ category, className = "h-6 w-6" }: { category: RequestCategory; className?: string }) {
  const { icon: Icon, color } = CATEGORY_CONFIG[category];
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
      <Icon className={className} />
    </span>
  );
}

export { CATEGORY_CONFIG };
