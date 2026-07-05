"use client";

import { formatTime } from "@/lib/dates/format";
import { cn } from "@/lib/utils/cn";
import type { GlucoseLog } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GlucoseMeasurementBadge } from "@/features/glucose/components/glucose-measurement-badge";
import { MealItemsDisclosure } from "@/features/glucose/components/meal-items-disclosure";
import { RecordActionButtons } from "@/components/ui/record-action-buttons";

interface GlucoseLogCardProps {
  log: GlucoseLog;
  onEdit: (log: GlucoseLog) => void;
  onDelete: (log: GlucoseLog) => void;
}

export function GlucoseLogCard({ log, onEdit, onDelete }: GlucoseLogCardProps) {
  return (
    <Card className="space-y-3 border-0 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <GlucoseMeasurementBadge type={log.measurement_type} />
            <span className="text-xs text-muted-foreground">{formatTime(log.measured_at)}</span>
          </div>
        </div>
        <RecordActionButtons onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <p
          className={cn(
            "font-heading text-2xl font-semibold leading-none",
            log.is_high ? "text-danger" : "text-foreground",
          )}
        >
          {Number(log.value).toFixed(1)}{" "}
          <span className="text-sm font-normal text-muted-foreground">ммоль/л</span>
        </p>
        {log.is_high ? <Badge variant="warning">Повышено</Badge> : null}
      </div>

      {log.measurement_type === "after_meal" && log.meal_text ? (
        <MealItemsDisclosure mealText={log.meal_text} />
      ) : null}
    </Card>
  );
}

interface GlucoseListProps {
  logs: GlucoseLog[];
  onEdit: (log: GlucoseLog) => void;
  onDelete: (log: GlucoseLog) => void;
}

export function GlucoseList({ logs, onEdit, onDelete }: GlucoseListProps) {
  if (logs.length === 0) return null;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <GlucoseLogCard key={log.id} log={log} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
