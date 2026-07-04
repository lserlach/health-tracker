import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "warning" | "success" | "muted";
}

const variantStyles = {
  default: "bg-primary-soft text-foreground",
  warning: "bg-warning text-warning-foreground",
  success: "bg-success text-success-foreground",
  muted: "bg-background text-muted-foreground border border-border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
