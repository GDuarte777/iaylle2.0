import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className, hover = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        hover ? "glass-card-hover" : "glass-card",
        "rounded-2xl p-6",
        className
      )}
    >
      {children}
    </div>
  );
};
