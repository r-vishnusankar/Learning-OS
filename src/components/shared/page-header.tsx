import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {backHref && (
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        )}
        <h1 className="text-page">{title}</h1>
        {description && <p className="max-w-2xl text-description">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
