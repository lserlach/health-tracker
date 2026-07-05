"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Drop, GearSix, Pill, Syringe, X } from "@phosphor-icons/react";
import {
  getMedicationLogsForDayAction,
  updateMedicationLogStatusAction,
} from "@/features/medications/actions/medication-log-actions";
import { getIntakeRelationLabel } from "@/features/medications/lib/validation";
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import { formatTime } from "@/lib/dates/format";
import { toDateKey } from "@/lib/dates/day";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

const iconMap = {
  pill: Pill,
  drop: Drop,
  syringe: Syringe,
} as const;

function getStatusBadge(status: MedicationLogWithMedication["status"]) {
  if (status === "taken") return { label: "Принято", variant: "success" as const };
  if (status === "skipped") return { label: "Пропущено", variant: "muted" as const };
  return { label: "Ожидает", variant: "warning" as const };
}

export function MedicationsPageClient({ minDateKey }: { minDateKey: string }) {
  const [dateKey, setDateKey] = useState(toDateKey());
  const [logs, setLogs] = useState<MedicationLogWithMedication[]>([]);
  const [pendingLogId, setPendingLogId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const load = useCallback(async () => {
    const result = await getMedicationLogsForDayAction(dateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setLogs([]);
      return;
    }
    setLogs(result.data);
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const taken = logs.filter((log) => log.status === "taken").length;
    return { taken, total: logs.length };
  }, [logs]);

  async function setStatus(
    log: MedicationLogWithMedication,
    status: MedicationLogWithMedication["status"],
  ) {
    const previousLogs = logs;
    const takenAt = status === "taken" ? log.scheduled_for : null;

    setPendingLogId(log.id);
    setLogs((current) =>
      current.map((item) =>
        item.id === log.id ? { ...item, status, taken_at: takenAt } : item,
      ),
    );

    const result = await updateMedicationLogStatusAction(
      log.id,
      status,
      takenAt ?? undefined,
    );

    setPendingLogId(null);

    if (result.error) {
      setLogs(previousLogs);
      setToast({ message: result.error, variant: "error" });
    }
  }

  return (
    <PageContainer>
      <AppHeader
        title="Лекарства"
        actions={
          <Link
            href="/medications/manage"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Управление лекарствами"
          >
            <GearSix size={22} />
          </Link>
        }
      />

      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      {logs.length > 0 ? (
        <section className="mb-6">
          <Card className="flex items-center justify-between gap-3 border-0 shadow-none">
            <div>
              <p className="text-sm text-muted-foreground">За день</p>
              <p className="font-heading text-2xl font-semibold">
                {stats.taken}/{stats.total}
              </p>
            </div>
            <Badge variant={stats.taken === stats.total && stats.total > 0 ? "success" : "muted"}>
              {stats.taken === stats.total && stats.total > 0 ? "Выполнено" : "В процессе"}
            </Badge>
          </Card>
        </section>
      ) : null}

      {logs.length === 0 ? (
        <EmptyState
          title="Нет лекарств на этот день"
          description="Добавьте лекарство в расписание или выберите другой день."
          action={
            <Link href="/medications/manage">
              <Button>Добавить лекарство</Button>
            </Link>
          }
        />
      ) : (
        <div className="mb-24 space-y-3">
          {logs.map((log) => {
            const Icon = iconMap[log.medications.icon as keyof typeof iconMap] ?? Pill;
            const statusBadge = getStatusBadge(log.status);
            const isOverdue =
              dateKey === toDateKey() &&
              log.status === "pending" &&
              new Date(log.scheduled_for).getTime() < Date.now();
            const isPending = pendingLogId === log.id;

            return (
              <Card
                key={log.id}
                className={cn("border-0 shadow-none", isOverdue && "border border-warning bg-warning/10")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon size={22} weight="regular" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading font-semibold">{log.medications.name}</p>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.medications.dosage} · {formatTime(log.scheduled_for)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getIntakeRelationLabel(log.medications.intake_relation)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant={log.status === "taken" ? "primary" : "secondary"}
                    className="flex-1"
                    disabled={isPending}
                    onClick={() =>
                      void setStatus(log, log.status === "taken" ? "pending" : "taken")
                    }
                  >
                    <Check size={18} weight="bold" />
                    {log.status === "taken" ? "Принято" : "Отметить"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() =>
                      void setStatus(log, log.status === "skipped" ? "pending" : "skipped")
                    }
                  >
                    <X size={18} weight="bold" />
                    {log.status === "skipped" ? "Вернуть" : "Пропустить"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
