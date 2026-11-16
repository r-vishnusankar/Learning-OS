"use client";

import { DEPARTMENT_LABELS } from "@/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DepartmentId } from "@/types";

const DEPARTMENT_ENTRIES = Object.entries(DEPARTMENT_LABELS) as [DepartmentId, string][];

export function DepartmentMultiSelect({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Departments",
}: {
  value: DepartmentId[];
  onChange: (next: DepartmentId[]) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const toggle = (id: DepartmentId) => {
    if (value.includes(id)) {
      if (value.length === 1) return;
      onChange(value.filter((d) => d !== id));
      return;
    }
    onChange([...value, id]);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label={ariaLabel}>
      {DEPARTMENT_ENTRIES.map(([id, label]) => {
        const selected = value.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge variant={selected ? "default" : "outline"} className="cursor-pointer px-3 py-1.5">
              {label}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

export function formatDepartmentList(ids: DepartmentId[], max = 3): string {
  const labels = ids.map((id) => DEPARTMENT_LABELS[id] ?? id);
  if (labels.length <= max) return labels.join(", ");
  return `${labels.slice(0, max).join(", ")} +${labels.length - max}`;
}
