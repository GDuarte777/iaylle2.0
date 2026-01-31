import * as React from "react";

import { cn } from "@/lib/utils";
import { useAccessControl } from "@/components/DashboardLayout";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { toolId?: string; pagePath?: string };

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, toolId, pagePath, onChange, onPointerDownCapture, onKeyDown, onPaste, onDrop, ...props }, ref) => {
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
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea";

export { Textarea };
