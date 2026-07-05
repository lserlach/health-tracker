import { Heartbeat } from "@phosphor-icons/react";
import { isElevatedPulse } from "@/features/blood-pressure/lib/validation";
import { cn } from "@/lib/utils/cn";

interface PulseIndicatorProps {
  pulse: number;
  className?: string;
}

export function PulseIndicator({ pulse, className }: PulseIndicatorProps) {
  const isElevated = isElevatedPulse(pulse);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        isElevated ? "text-danger" : "text-primary",
        className,
      )}
    >
      <Heartbeat size={14} weight="fill" aria-hidden />
      {pulse}
    </span>
  );
}
