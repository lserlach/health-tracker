import {
  PREGNANCY_TOTAL_DAYS,
  TRIMESTER_DAY_BOUNDS,
  type PregnancyProgress,
} from "@/lib/pregnancy/calculate";
import { cn } from "@/lib/utils/cn";

interface PregnancyProgressBarProps {
  progress: PregnancyProgress;
  dueLabel?: string | null;
  className?: string;
}

const trimesterLabels = ["I", "II", "III"] as const;

function getTrimesterWidths() {
  return TRIMESTER_DAY_BOUNDS.slice(1).map((end, index) => {
    const start = TRIMESTER_DAY_BOUNDS[index];
    return ((end - start) / PREGNANCY_TOTAL_DAYS) * 100;
  });
}

export function PregnancyProgressBar({ progress, dueLabel, className }: PregnancyProgressBarProps) {
  const segmentWidths = getTrimesterWidths();
  const filledWidth = progress.progressPercent;
  const progressLabel = `${Math.round(filledWidth)}%`;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-center gap-3",
          dueLabel ? "justify-between" : "justify-end",
        )}
      >
        {dueLabel ? (
          <span className="text-xs font-medium text-white/80">{dueLabel}</span>
        ) : null}
        <span className="shrink-0 text-xs font-medium text-white/80">{progressLabel}</span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/20">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${filledWidth}%` }}
        />

        <div
          className="absolute inset-y-0 w-px bg-white/35"
          style={{ left: `${(TRIMESTER_DAY_BOUNDS[1] / PREGNANCY_TOTAL_DAYS) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-white/35"
          style={{ left: `${(TRIMESTER_DAY_BOUNDS[2] / PREGNANCY_TOTAL_DAYS) * 100}%` }}
        />
      </div>

      <div className="flex">
        {segmentWidths.map((width, index) => {
          const trimester = (index + 1) as 1 | 2 | 3;
          const isActive = progress.currentTrimester === trimester;

          return (
            <div
              key={trimesterLabels[index]}
              className={cn(
                "text-center text-[11px] transition-colors",
                isActive ? "font-medium text-white" : "text-white/60",
              )}
              style={{ width: `${width}%` }}
            >
              {trimesterLabels[index]} трим.
            </div>
          );
        })}
      </div>
    </div>
  );
}
