import { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  hintVariant?: BadgeProps["variant"];
  icon?: ReactNode;
  className?: string;
}

const valueColorByVariant = {
  default: "text-primary",
  warning: "text-warning-foreground",
  success: "text-primary",
  muted: "text-muted-foreground",
} as const;

export function StatCard({ label, value, hint, hintVariant, icon, className }: StatCardProps) {
  const statusBadge =
    hint && hintVariant ? (
      <Badge
        variant={hintVariant}
        trend={hintVariant === "warning" ? "up" : hintVariant === "success" ? "down" : undefined}
        className="shrink-0"
      >
        {hint}
      </Badge>
    ) : null;

  return (
    <Card className={cn("flex flex-col gap-2 border-0 shadow-none", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex shrink-0 items-center gap-2">
          {statusBadge}
          {icon ? (
            <div className="text-primary" aria-hidden>
              {icon}
            </div>
          ) : null}
        </div>
      </div>
      <p
        className={cn(
          "font-heading text-2xl font-semibold leading-none",
          hintVariant ? valueColorByVariant[hintVariant] : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && !hintVariant ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
