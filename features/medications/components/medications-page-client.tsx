"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { Toast } from "@/components/ui/toast";

interface MedicationsPageClientProps {
  minDateKey: string;
  initialDateKey: string;
  initialLogs: MedicationLogWithMedication[];
}

export function MedicationsPageClient({
  minDateKey,
  initialDateKey,
  initialLogs,
}: MedicationsPageClientProps) {
  const inFlightLogIds = useRef(new Set<string>());
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [logsByDate, setLogsByDate] = useState<Record<string, MedicationLogWithMedication[]>>({
    [initialDateKey]: initialLogs,
  });
  const [loadingDateKey, setLoadingDateKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const load = useCallback(async (targetDateKey: string) => {
    setLoadingDateKey(targetDateKey);
    const result = await getMedicationLogsForDayAction(targetDateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setLogsByDate((current) => ({ ...current, [targetDateKey]: [] }));
    } else {
      setLogsByDate((current) => ({ ...current, [targetDateKey]: result.data }));
    }
    setLoadingDateKey(null);
  }, []);

  useEffect(() => {
    if (logsByDate[dateKey] !== undefined) return;
    void load(dateKey);
  }, [dateKey, logsByDate, load]);

  const logs = logsByDate[dateKey];
  const isLoading = logs === undefined || loadingDateKey === dateKey;

  async function setStatus(
    log: MedicationLogWithMedication,
    status: MedicationLogWithMedication["status"],
  ) {
    if (inFlightLogIds.current.has(log.id)) return;

    const previousLogs = logs ?? [];
    const takenAt = status === "taken" ? log.scheduled_for : null;

    inFlightLogIds.current.add(log.id);
    setLogsByDate((current) => ({
      ...current,
      [dateKey]: (current[dateKey] ?? []).map((item) =>
        item.id === log.id ? { ...item, status, taken_at: takenAt } : item,
      ),
    }));

    const result = await updateMedicationLogStatusAction(
      log.id,
      status,
      takenAt ?? undefined,
    );

    inFlightLogIds.current.delete(log.id);

    if (result.error) {
      setLogsByDate((current) => ({ ...current, [dateKey]: previousLogs }));
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

      {isLoading ? (
        <PageLoadingState />
      ) : (logs ?? []).length === 0 ? (
        <EmptyState
          title="Нет лекарств на этот день"
          description="Добавьте лекарство в расписание или выберите другой день."
        />
      ) : (
        <MedicationChecklist
          logs={logs ?? []}
          dateKey={dateKey}
          onToggleTaken={toggleTaken}
          onToggleSkipped={toggleSkipped}
          className="mb-24"
        />
      )}

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
