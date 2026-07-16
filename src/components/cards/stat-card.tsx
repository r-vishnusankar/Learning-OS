import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className, accent }: StatCardProps) {
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
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {trend && <span className="font-medium text-success">{trend} </span>}
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105"
          style={{ background: accent ? `${accent}18` : "var(--accent)", color: accent || "var(--primary)" }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
