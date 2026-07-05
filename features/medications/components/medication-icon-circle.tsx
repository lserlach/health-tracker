"use client";

import { getMedicationIconClassName } from "@/features/medications/lib/medication-colors";
import { getMedicationIconComponent } from "@/features/medications/lib/medication-icons";
import { cn } from "@/lib/utils/cn";

interface MedicationIconCircleProps {
  icon: string;
  color?: string | null;
  className?: string;
  iconSize?: number;
}

export function MedicationIconCircle({
  icon,
  color,
  className,
  iconSize = 22,
}: MedicationIconCircleProps) {
  const Icon = getMedicationIconComponent(icon);

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
        getMedicationIconClassName(color),
        className,
      )}
    >
      <Icon size={iconSize} weight="regular" aria-hidden />
    </div>
  );
}
