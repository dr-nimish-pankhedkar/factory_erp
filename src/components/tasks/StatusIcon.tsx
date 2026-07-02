import { Circle, Clock, CheckCircle2 } from "lucide-react";
import type { TaskStatus } from "@/types/database";

const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Circle; color: string; label: string }> = {
  not_started: { icon: Circle, color: "text-red-500", label: "Not started" },
  in_progress: { icon: Clock, color: "text-amber-500", label: "In progress" },
  done: { icon: CheckCircle2, color: "text-green-600", label: "Done" },
};

export function StatusIcon({ status, className = "h-6 w-6" }: { status: TaskStatus; className?: string }) {
  const { icon: Icon, color, label } = STATUS_CONFIG[status];
  return <Icon className={`${color} ${className}`} aria-label={label} fill="currentColor" fillOpacity={0.15} />;
}

export { STATUS_CONFIG };
