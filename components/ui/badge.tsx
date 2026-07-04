import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "warning" | "success" | "muted";
  trend?: "up" | "down";
}

const variantStyles = {
  default: "bg-primary/12 text-primary",
  warning: "bg-danger/12 text-danger",
  success: "bg-primary/12 text-primary",
  muted: "bg-background text-muted-foreground border border-border",
};

export function Badge({
  className,
  variant = "default",
  trend,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-[5px] px-1.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {trend ? (
        <span className="mt-px h-1 w-1 shrink-0 rounded-full bg-current" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
