import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useAccessControl } from "@/components/DashboardLayout";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  toolId?: string;
  pagePath?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, toolId, pagePath, onClick, onPointerDownCapture, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const access = useAccessControl();
    const resolvedToolId = toolId ?? (typeof props.id === "string" ? props.id : undefined);
    const isBlocked = Boolean(!props.disabled && access && !access.canUseTool(resolvedToolId, pagePath));

    const handlePointerDownCapture = (e: React.PointerEvent<any>) => {
      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        access?.notifyToolBlocked();
        return;
      }
      onPointerDownCapture?.(e);
    };

    const handleClick = (e: React.MouseEvent<any>) => {
      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        access?.notifyToolBlocked();
        return;
      }
      onClick?.(e as any);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), isBlocked && "opacity-50 cursor-not-allowed")}
        ref={ref}
        aria-disabled={props["aria-disabled"] ?? isBlocked}
        onPointerDownCapture={handlePointerDownCapture}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
