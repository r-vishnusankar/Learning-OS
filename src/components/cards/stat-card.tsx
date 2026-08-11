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
        "group relative overflow-hidden rounded-[length:var(--radius)] border border-border bg-card p-4 transition-colors duration-150 hover:border-border-control",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-1.5 font-data text-xl font-semibold tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {trend && <span className="font-medium text-success-on-light">{trend} </span>}
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[length:var(--radius)]"
          style={{ background: tone.tint, color: tone.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
