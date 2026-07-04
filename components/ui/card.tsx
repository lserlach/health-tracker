import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-(--radius-card) border border-border bg-card p-4 shadow-sm shadow-primary/5",
        className,
      )}
      {...props}
    />
  );
}
