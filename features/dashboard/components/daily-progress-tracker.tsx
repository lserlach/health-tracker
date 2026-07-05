"use client";

import { Cookie, ForkKnife, Heartbeat, Pill, Scales, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

export interface DailyProgressStatus {
  glucose: boolean;
  meal: boolean;
  medication: boolean;
  bloodPressure: boolean;
  weight: boolean;
}

interface DailyProgressTrackerProps {
  status: DailyProgressStatus;
  className?: string;
}

const trackerItems: {
  key: keyof DailyProgressStatus;
  label: string;
  icon: Icon;
}[] = [
  { key: "glucose", label: "Сахар", icon: Cookie },
  { key: "bloodPressure", label: "Давление", icon: Heartbeat },
  { key: "medication", label: "Лекарства", icon: Pill },
  { key: "weight", label: "Вес", icon: Scales },
  { key: "meal", label: "Еда", icon: ForkKnife },
];

export function DailyProgressTracker({ status, className }: DailyProgressTrackerProps) {
  const completedCount = trackerItems.filter((item) => status[item.key]).length;

  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Заполнение дня</p>
        <p className="text-sm font-medium text-foreground">
          {completedCount}/{trackerItems.length}
        </p>
      </div>

      <div className="flex items-center gap-2" aria-label="Прогресс заполнения за сегодня">
        {trackerItems.map((item) => {
          const isComplete = status[item.key];
          const IconComponent = item.icon;

          return (
            <div
              key={item.key}
              title={item.label}
              aria-label={`${item.label}: ${isComplete ? "заполнено" : "не заполнено"}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                isComplete
                  ? "bg-primary text-white"
                  : "border border-primary/10 bg-card text-muted-foreground/40",
              )}
            >
              <IconComponent size={18} weight={isComplete ? "fill" : "regular"} aria-hidden />
            </div>
          );
        })}
      </div>
    </div>
  );
}
