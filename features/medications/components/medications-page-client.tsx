"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GearSix } from "@phosphor-icons/react";
import {
  getMedicationLogsForDayAction,
  updateMedicationLogStatusAction,
} from "@/features/medications/actions/medication-log-actions";
import { MedicationChecklist } from "@/features/medications/components/medication-checklist";
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import { toDateKey } from "@/lib/dates/day";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";

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

  function toggleTaken(log: MedicationLogWithMedication) {
    void setStatus(log, log.status === "taken" ? "pending" : "taken");
  }

  function toggleSkipped(log: MedicationLogWithMedication) {
    void setStatus(log, log.status === "skipped" ? "pending" : "skipped");
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
        <MedicationChecklist
          logs={logs}
          dateKey={dateKey}
          pendingLogId={pendingLogId}
          onToggleTaken={toggleTaken}
          onToggleSkipped={toggleSkipped}
          className="mb-24"
        />
      )}

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
