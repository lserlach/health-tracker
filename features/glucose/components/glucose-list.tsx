"use client";

import { PencilSimple, Trash } from "@phosphor-icons/react";
import { getMeasurementTypeLabel } from "@/features/glucose/lib/validation";
import { formatDateTime } from "@/lib/dates/format";
import type { GlucoseLog } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
        <Card key={log.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {Number(log.value).toFixed(1)}{" "}
                <span className="text-sm font-normal text-muted-foreground">ммоль/л</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(log.measured_at)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEdit(log)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-primary-soft hover:text-primary"
                aria-label="Редактировать"
              >
                <PencilSimple size={18} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(log)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-danger/12 hover:text-danger"
                aria-label="Удалить"
              >
                <Trash size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{getMeasurementTypeLabel(log.measurement_type)}</Badge>
            {log.is_high ? <Badge variant="warning">Повышено</Badge> : null}
          </div>

          {log.measurement_type === "after_meal" && log.meal_text ? (
            <p className="text-sm text-muted-foreground">
              {log.meal_text}
              {log.minutes_after_meal ? ` · через ${log.minutes_after_meal} мин` : ""}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
