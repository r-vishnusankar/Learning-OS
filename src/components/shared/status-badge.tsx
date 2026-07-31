import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatStatusLabel, statusToBadgeVariant } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: string;
  label?: string;
}

/** Semantic status chip — always maps failed/error to red, success to green, etc. */
export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  return (
    <Badge
      variant={statusToBadgeVariant(status)}
      className={cn("capitalize", className)}
      {...props}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
