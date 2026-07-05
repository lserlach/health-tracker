"use client";

import { Check, X } from "@phosphor-icons/react";
import { MedicationIconCircle } from "@/features/medications/components/medication-icon-circle";
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import { formatTime } from "@/lib/dates/format";
import { toDateKey } from "@/lib/dates/day";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface MedicationChecklistProps {
  logs: MedicationLogWithMedication[];
  dateKey?: string;
  pendingLogId?: string | null;
  onToggleTaken: (log: MedicationLogWithMedication) => void;
  onToggleSkipped: (log: MedicationLogWithMedication) => void;
  className?: string;
}

export function MedicationChecklist({
  logs,
  dateKey = toDateKey(),
  pendingLogId = null,
  onToggleTaken,
  onToggleSkipped,
  className,
}: MedicationChecklistProps) {
  const takenCount = logs.filter((log) => log.status === "taken").length;

  return (
    <Card className={cn("overflow-hidden border-0 shadow-none", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-1 pb-3">
        <p className="text-sm text-muted-foreground">
          Принято{" "}
          <span className="font-medium text-foreground">
            {takenCount}/{logs.length}
          </span>
        </p>
      </div>

      <ul className="divide-y divide-border/60">
        {logs.map((log) => {
          const isTaken = log.status === "taken";
          const isSkipped = log.status === "skipped";
          const isPending = pendingLogId === log.id;
          const isOverdue =
            dateKey === toDateKey() &&
            log.status === "pending" &&
            new Date(log.scheduled_for).getTime() < Date.now();

          return (
            <li key={log.id}>
              <div
                className={cn(
                  "flex items-center gap-3 py-3",
                  isOverdue && "rounded-(--radius-button) bg-warning/10 px-2",
                )}
              >
                <button
                  type="button"
                  aria-label={
                    isTaken
                      ? `Отменить приём: ${log.medications.name}`
                      : `Отметить принятым: ${log.medications.name}`
                  }
                  disabled={isPending || isSkipped}
                  onClick={() => onToggleTaken(log)}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isTaken
                      ? "border-primary bg-primary text-white"
                      : "border-primary/25 bg-card",
                    isSkipped && "border-muted-foreground/25 bg-muted/30",
                    isPending && "opacity-60",
                  )}
                >
                  {isTaken ? <Check size={16} weight="bold" aria-hidden /> : null}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onToggleTaken(log)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <MedicationIconCircle
                    icon={log.medications.icon}
                    color={log.medications.icon_color}
                    className={cn("h-9 w-9", (isTaken || isSkipped) && "opacity-50")}
                    iconSize={18}
                  />

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate font-medium text-foreground",
                        (isTaken || isSkipped) && "text-muted-foreground line-through",
                      )}
                    >
                      {log.medications.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {log.medications.dosage} · {formatTime(log.scheduled_for)}
                      {isSkipped ? " · пропущено" : isTaken ? " · принято" : null}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  aria-label={
                    isSkipped
                      ? `Вернуть в список: ${log.medications.name}`
                      : `Пропустить: ${log.medications.name}`
                  }
                  disabled={isPending || isTaken}
                  onClick={() => onToggleSkipped(log)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40",
                    isSkipped && "bg-muted/40 text-foreground",
                    (isPending || isTaken) && "opacity-40",
                  )}
                >
                  <X size={16} weight="bold" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
