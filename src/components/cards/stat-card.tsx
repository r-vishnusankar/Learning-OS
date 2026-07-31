import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatCardAccent = "primary" | "success" | "info" | "warning";

const ACCENT_VARS: Record<
  StatCardAccent,
  { color: string; tint: string }
> = {
  primary: { color: "var(--primary)", tint: "color-mix(in oklab, var(--primary) 12%, transparent)" },
  success: { color: "var(--success-on-light)", tint: "color-mix(in oklab, var(--success) 12%, transparent)" },
  info: { color: "var(--info)", tint: "color-mix(in oklab, var(--info) 12%, transparent)" },
  warning: { color: "var(--warning-foreground)", tint: "color-mix(in oklab, var(--warning) 12%, transparent)" },
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: StatCardAccent;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  accent = "primary",
}: StatCardProps) {
  const tone = ACCENT_VARS[accent];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border-0 bg-card p-5 shadow-(--shadow-sm) transition duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-md)",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 font-data font-display text-2xl font-semibold tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {trend && <span className="font-medium text-success-on-light">{trend} </span>}
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105"
          style={{ background: tone.tint, color: tone.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
