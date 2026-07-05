"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { isElevatedBloodPressure } from "@/features/blood-pressure/lib/validation";
import { PulseIndicator } from "@/features/blood-pressure/components/pulse-indicator";
import { cn } from "@/lib/utils/cn";
import type { BloodPressureLog } from "@/types/database.types";
import { RecordActionButtons } from "@/components/ui/record-action-buttons";

interface BloodPressureAllLogsListProps {
  logs: BloodPressureLog[];
  onEdit: (log: BloodPressureLog) => void;
  onDelete: (log: BloodPressureLog) => void;
}

function groupLogsByMonth(logs: BloodPressureLog[]) {
  const groups = new Map<string, BloodPressureLog[]>();

  for (const log of logs) {
    const monthKey = format(parseISO(log.measured_at), "yyyy-MM");
    const bucket = groups.get(monthKey) ?? [];
    bucket.push(log);
    groups.set(monthKey, bucket);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([monthKey, monthLogs]) => ({
      monthKey,
      monthLabel: format(parseISO(`${monthKey}-01`), "LLLL", { locale: ru }),
      logs: monthLogs.sort(
        (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
      ),
    }));
}

export function BloodPressureAllLogsList({
  logs,
  onEdit,
  onDelete,
}: BloodPressureAllLogsListProps) {
  const groupedLogs = useMemo(() => groupLogsByMonth(logs), [logs]);

  return (
    <div className="overflow-hidden rounded-(--radius-card) bg-card">
      {groupedLogs.map((group, groupIndex) => (
        <section key={group.monthKey}>
          <div className={cn("py-3 text-center", groupIndex > 0 && "border-t border-border/60")}>
            <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
              {group.monthLabel}
            </span>
          </div>

          {group.logs.map((log, index) => {
            const isElevated = isElevatedBloodPressure(log.systolic, log.diastolic);
            const isLastInGroup = index === group.logs.length - 1;

            return (
              <div key={log.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-[7.25rem] shrink-0 text-sm text-muted-foreground">
                    {format(parseISO(log.measured_at), "d MMM HH:mm", { locale: ru })}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "font-heading text-base font-semibold tabular-nums",
                          isElevated ? "text-danger" : "text-foreground",
                        )}
                      >
                        {log.systolic} / {log.diastolic}
                      </span>
                      {log.pulse ? <PulseIndicator pulse={log.pulse} /> : null}
                    </div>
                    <RecordActionButtons onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
                  </div>
                </div>

                {!isLastInGroup ? <div className="ml-[calc(1rem+7.25rem)] mr-4 border-b border-border/60" /> : null}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
