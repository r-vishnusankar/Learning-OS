import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[4px] border-0 px-2 py-0.5 text-xs font-medium leading-none tabular-nums transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-transparent text-foreground",
        accent: "bg-pastel-purple text-foreground",
        /* Status */
        success: "bg-success/15 text-success-on-light",
        warning: "bg-warning/15 text-warning-foreground",
        pending: "bg-pastel-yellow text-pastel-yellow-foreground",
        info: "bg-info/15 text-info-on-tint",
        destructive: "bg-destructive/15 text-destructive-on-tint",
        draft: "bg-muted text-muted-foreground",
        /* Level ramp — subtle gray tints */
        beginner: "bg-muted text-muted-foreground",
        intermediate: "bg-secondary text-secondary-foreground",
        advanced: "bg-foreground/10 text-foreground",
        expert: "bg-foreground text-background",
        /* Learning category */
        role: "bg-pastel-blue text-info-on-tint",
        goal: "bg-pastel-purple text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
