import * as React from "react";

import { cn } from "@/lib/utils";
import { useAccessControl } from "@/components/DashboardLayout";

type InputProps = React.ComponentProps<"input"> & { toolId?: string; pagePath?: string };

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, toolId, pagePath, onChange, onPointerDownCapture, onKeyDown, onPaste, onDrop, ...props }, ref) => {
    const access = useAccessControl();
    const resolvedToolId = toolId ?? (typeof props.id === "string" ? props.id : undefined);
    const isBlocked = Boolean(!props.disabled && access && !access.canUseTool(resolvedToolId, pagePath));

    const block = (e: any, cb?: (ev: any) => void) => {
      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        access?.notifyToolBlocked();
        return;
      }
      cb?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
          isBlocked && "opacity-50 cursor-not-allowed",
        )}
        ref={ref}
        aria-disabled={props["aria-disabled"] ?? isBlocked}
        readOnly={props.readOnly ?? isBlocked}
        onPointerDownCapture={(e) => block(e, onPointerDownCapture)}
        onKeyDown={(e) => block(e, onKeyDown)}
        onPaste={(e) => block(e, onPaste)}
        onDrop={(e) => block(e, onDrop)}
        onChange={(e) => block(e, onChange)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
