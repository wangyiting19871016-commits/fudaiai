import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "light" | "dark" | "gradient";
  hoverEffect?: boolean;
}

/**
 * Glassmorphism玻璃态卡片组件
 * 适用于福袋AI春节主题
 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, variant = "light", hoverEffect = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-300",
          variant === "light" && "bg-white/60 backdrop-blur-xl border-white/40 shadow-sm",
          variant === "dark" && "bg-black/40 backdrop-blur-xl border-white/10 shadow-md text-white",
          variant === "gradient" && "bg-gradient-to-br from-rose-500/90 to-orange-500/90 text-white border-transparent shadow-lg shadow-rose-500/20",
          hoverEffect && "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export default GlassCard;
