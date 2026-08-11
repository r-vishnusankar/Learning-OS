import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, className, icon }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[length:var(--radius)] border border-border bg-card px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[length:var(--radius)] bg-secondary text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6 stroke-[1.75]" />}
      </div>
      <h3 className="text-card-title">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-description text-sm">{description}</p>}
      {actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
