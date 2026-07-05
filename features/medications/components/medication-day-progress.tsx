"use client";

import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import { getMedicationIconClassName } from "@/features/medications/lib/medication-colors";
import { getMedicationIconComponent } from "@/features/medications/lib/medication-icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface MedicationDayProgressProps {
  logs: MedicationLogWithMedication[];
}

export function MedicationDayProgress({ logs }: MedicationDayProgressProps) {
  const takenCount = logs.filter((log) => log.status === "taken").length;

  return (
    <Card className="border-0 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">За день</p>
          <p className="text-sm font-medium text-foreground">
            {takenCount}/{logs.length}
          </p>
        </div>

        <div
          className="flex flex-row-reverse items-center gap-2"
          aria-label="Прогресс приёма лекарств за день"
        >
          {logs.map((log) => {
            const Icon = getMedicationIconComponent(log.medications.icon);
            const isTaken = log.status === "taken";
            const isSkipped = log.status === "skipped";

            return (
              <div
                key={log.id}
                title={`${log.medications.name}: ${
                  isTaken ? "принято" : isSkipped ? "пропущено" : "ожидает"
                }`}
                aria-label={`${log.medications.name}: ${
                  isTaken ? "принято" : isSkipped ? "пропущено" : "ожидает"
                }`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  isTaken
                    ? getMedicationIconClassName(log.medications.icon_color)
                    : isSkipped
                      ? "border border-muted-foreground/20 bg-muted/40 text-muted-foreground/60"
                      : "border border-primary/10 bg-card text-muted-foreground/40",
                )}
              >
                <Icon size={18} weight={isTaken ? "fill" : "regular"} aria-hidden />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
