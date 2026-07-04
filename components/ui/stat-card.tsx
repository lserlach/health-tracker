import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon ? (
          <div className="text-primary" aria-hidden>
            {icon}
          </div>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
