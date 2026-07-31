import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-0 px-3 py-1 text-sm font-medium leading-none tabular-nums transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-card text-foreground shadow-(--shadow-sm)",
        accent: "bg-pastel-purple text-primary",
        /* Status: tint + rely on label/icon in UI (dual-channel) */
        success: "bg-success/15 text-success-on-light",
        warning: "bg-warning/15 text-warning-foreground",
        /** Soft/passive attention (tier 1) — no pending colour token */
        pending: "bg-pastel-yellow text-pastel-yellow-foreground",
        info: "bg-info/15 text-info",
        destructive: "bg-destructive/15 text-destructive",
        draft: "bg-muted text-muted-foreground",
        /** Categorical level ramp — violet intensity, not status colours */
        beginner: "bg-primary/10 text-primary",
        intermediate: "bg-primary/20 text-primary",
        advanced: "bg-primary/35 text-primary",
        expert: "bg-primary-strong text-primary-foreground",
        /** Learning category — categorical, not status */
        role: "bg-pastel-blue text-info",
        goal: "bg-pastel-purple text-primary",
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
