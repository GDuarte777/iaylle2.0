import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { useAccessControl } from "@/components/DashboardLayout";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "neon" | "glass" | "outline";
  className?: string;
  toolId?: string;
  pagePath?: string;
}

export const NeonButton = ({
  children,
  variant = "neon",
  className,
  toolId,
  pagePath,
  onClick,
  onPointerDownCapture,
  ...props
}: NeonButtonProps) => {
  const access = useAccessControl();
  const resolvedToolId = toolId ?? (typeof props.id === "string" ? props.id : undefined);
  const isBlocked = Boolean(!props.disabled && access && !access.canUseTool(resolvedToolId, pagePath));

  const handlePointerDownCapture = (e: any) => {
    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      access?.notifyToolBlocked();
      return;
    }
    onPointerDownCapture?.(e);
  };

  const handleClick = (e: any) => {
    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      access?.notifyToolBlocked();
      return;
    }
    onClick?.(e);
  };

  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 whitespace-nowrap active:scale-95 disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    neon: "btn-neon",
    glass: "btn-glass",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className, isBlocked && "opacity-50 cursor-not-allowed")}
      aria-disabled={props["aria-disabled"] ?? isBlocked}
      onPointerDownCapture={handlePointerDownCapture}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
