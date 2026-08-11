import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "rounded-[length:var(--radius-control)] bg-primary text-primary-foreground hover:bg-primary-hover active:opacity-90",
        secondary:
          "rounded-[length:var(--radius-control)] bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-hover",
        outline:
          "rounded-[length:var(--radius-control)] border border-border bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground active:bg-secondary-hover",
        ghost:
          "rounded-[length:var(--radius-control)] bg-transparent text-foreground hover:bg-secondary active:bg-secondary-hover",
        destructive:
          "rounded-[length:var(--radius-control)] bg-destructive text-destructive-foreground hover:bg-destructive-hover active:opacity-90",
        success:
          "rounded-[length:var(--radius-control)] bg-success text-success-foreground hover:bg-success-hover active:opacity-90",
        link: "text-primary underline-offset-4 hover:underline active:opacity-75",
      },
      size: {
        default: "h-8 px-3.5",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-9 px-5 text-sm",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
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
