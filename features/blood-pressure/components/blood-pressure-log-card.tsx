import { isElevatedBloodPressure } from "@/features/blood-pressure/lib/validation";
import { PulseIndicator } from "@/features/blood-pressure/components/pulse-indicator";
import { cn } from "@/lib/utils/cn";
import type { BloodPressureLog } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RecordActionButtons } from "@/components/ui/record-action-buttons";

interface BloodPressureLogCardProps {
  log: BloodPressureLog;
  timestampLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function BloodPressureLogCard({
  log,
  timestampLabel,
  onEdit,
  onDelete,
}: BloodPressureLogCardProps) {
  const isElevated = isElevatedBloodPressure(log.systolic, log.diastolic);

  return (
    <Card className="border-0 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-heading text-2xl font-semibold leading-none",
                isElevated ? "text-danger" : "text-foreground",
              )}
            >
              {log.systolic}/{log.diastolic}
            </p>
            <Badge variant={isElevated ? "warning" : "success"}>
              {isElevated ? "Повышено" : "В норме"}
            </Badge>
          </div>
          {log.pulse ? <PulseIndicator pulse={log.pulse} className="mt-2" /> : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <RecordActionButtons onEdit={onEdit} onDelete={onDelete} />
          <span className="text-sm text-muted-foreground">{timestampLabel}</span>
        </div>
      </div>
    </Card>
  );
}
