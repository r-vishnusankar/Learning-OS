export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "accent"
  | "success"
  | "warning"
  | "pending"
  | "info"
  | "destructive"
  | "draft"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "role"
  | "goal";

/** Map domain status strings to semantic badge variants. */
export function statusToBadgeVariant(status: string | null | undefined): StatusBadgeVariant {
  const key = (status ?? "").toLowerCase().replace(/\s+/g, "_");

  switch (key) {
    case "completed":
    case "passed":
    case "earned":
    case "active":
    case "published":
    case "approved":
    case "graded":
    case "success":
    case "available":
      return "success";

    case "failed":
    case "rejected":
    case "error":
    case "destructive":
    case "revoked":
    case "expired":
      return "destructive";

    case "warning":
    case "overdue":
    case "action_required":
    case "expiring":
    case "overdue_attention":
      return "warning";

    case "pending":
    case "in_progress":
    case "in-progress":
    case "submitted":
    case "in_review":
    case "review":
    case "upcoming":
      /* Soft/passive attention — pastel-yellow badge, not a pending colour token */
      return "pending";

    case "info":
    case "not_started":
      return "info";

    case "beginner":
      return "beginner";

    case "intermediate":
    case "associate":
      return "intermediate";

    case "advanced":
    case "senior":
      return "advanced";

    case "expert":
    case "architect":
    case "lead":
    case "qa_manager":
    case "product_owner":
    case "assistant_hr_manager":
    case "hr_manager":
      return "expert";

    case "draft":
    case "inactive":
    case "archived":
    case "locked":
    case "disabled":
      return "draft";

    default:
      return "secondary";
  }
}

/** Level → violet tint ramp (categorical — not status colours). */
export function levelToBadgeVariant(level: string | null | undefined): StatusBadgeVariant {
  const key = (level ?? "").toLowerCase();
  if (key === "beginner") return "beginner";
  if (key === "intermediate" || key === "associate") return "intermediate";
  if (key === "advanced" || key === "senior") return "advanced";
  if (key === "expert" || key === "architect" || key === "lead") return "expert";
  if (
    key === "qa_manager" ||
    key === "product_owner" ||
    key === "assistant_hr_manager" ||
    key === "hr_manager"
  ) {
    return "expert";
  }
  return "secondary";
}

export function learningCategoryToBadgeVariant(
  category: string | null | undefined
): StatusBadgeVariant {
  return category === "goal" ? "goal" : "role";
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
