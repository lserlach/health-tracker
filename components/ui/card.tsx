import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
}

export function Card({
  className,
  flat = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-(--radius-card) bg-card p-4",
        flat ? "border-0 shadow-none" : "border border-border shadow-sm shadow-primary/5",
        className,
      )}
      {...props}
    />
  );
}
