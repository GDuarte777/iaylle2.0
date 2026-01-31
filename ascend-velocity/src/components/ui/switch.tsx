import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { useAccessControl } from "@/components/DashboardLayout";

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  toolId?: string;
  pagePath?: string;
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, toolId, pagePath, onCheckedChange, onPointerDownCapture, onClick, ...props }, ref) => {
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

  const handleCheckedChange = (checked: boolean) => {
    if (isBlocked) {
      access?.notifyToolBlocked();
      return;
    }
    onCheckedChange?.(checked);
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
        isBlocked && "opacity-50 cursor-not-allowed",
      )}
      {...props}
      ref={ref}
      aria-disabled={props["aria-disabled"] ?? isBlocked}
      onCheckedChange={handleCheckedChange}
      onPointerDownCapture={(e) => block(e, onPointerDownCapture)}
      onClick={(e) => block(e, onClick)}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
