import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** High emphasis = pill; lower emphasis = --radius-control (18px). */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary-strong text-primary-foreground shadow-(--shadow-sm) hover:bg-primary-hover hover:shadow-(--shadow)",
        secondary:
          "rounded-[length:var(--radius-control)] bg-secondary text-secondary-foreground shadow-(--shadow-sm) hover:bg-secondary/80",
        outline:
          "rounded-[length:var(--radius-control)] border-0 bg-card text-foreground shadow-(--shadow-sm) hover:bg-secondary hover:text-secondary-foreground",
        ghost:
          "rounded-[length:var(--radius-control)] bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground",
        destructive:
          "rounded-full bg-destructive text-destructive-foreground shadow-(--shadow-sm) hover:bg-destructive-hover dark:bg-destructive-tint dark:text-destructive dark:hover:bg-destructive-hover",
        success:
          "rounded-full bg-success text-success-foreground shadow-(--shadow-sm) hover:bg-success-hover dark:bg-success-tint dark:text-success dark:hover:bg-success-hover",
        link: "rounded-[length:var(--radius-control)] text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
