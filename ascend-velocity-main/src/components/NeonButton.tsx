import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "neon" | "glass" | "outline";
  className?: string;
}

export const NeonButton = ({
  children,
  variant = "neon",
  className,
  ...props
}: NeonButtonProps) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-300";
  
  const variantStyles = {
    neon: "btn-neon",
    glass: "btn-glass",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
