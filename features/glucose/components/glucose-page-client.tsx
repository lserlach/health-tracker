"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import {
  deleteGlucoseLogAction,
  getGlucoseLogsForDayAction,
  saveGlucoseLogAction,
} from "@/features/glucose/actions/glucose-actions";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";
import { GlucoseForm } from "@/features/glucose/components/glucose-form";
import { GlucoseList } from "@/features/glucose/components/glucose-list";
import type { GlucoseLog } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Toast } from "@/components/ui/toast";
import { getDefaultMeasuredAt, parseDateKey, toDateKey } from "@/lib/dates/day";

interface GlucosePageClientProps {
  minDateKey: string;
}

function sortGlucoseLogs(logs: GlucoseLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );
}

export function GlucosePageClient({ minDateKey }: GlucosePageClientProps) {
  const [dateKey, setDateKey] = useState(toDateKey());
  const [logs, setLogs] = useState<GlucoseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<GlucoseLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlucoseLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    const result = await getGlucoseLogsForDayAction(dateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setLogs([]);
    } else {
      setLogs(result.data);
    }
    setIsLoading(false);
  }, [dateKey]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const stats = useMemo(() => {
    if (logs.length === 0) {
      return { last: "—", avg: "—", highCount: 0 };
    }
    const last = Number(logs[0].value).toFixed(1);
    const avg = (
      logs.reduce((sum, log) => sum + Number(log.value), 0) / logs.length
    ).toFixed(1);
    const highCount = logs.filter((log) => log.is_high).length;
    return { last, avg, highCount };
  }, [logs]);

  async function handleSubmit(values: GlucoseFormValues) {
    const result = await saveGlucoseLogAction(values, editingLog?.id);

    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    if (result.data) {
      setLogs((current) =>
        sortGlucoseLogs(
          editingLog
            ? current.map((log) => (log.id === editingLog.id ? result.data! : log))
            : [result.data, ...current],
        ),
      );
    }

    setToast({ message: editingLog ? "Запись обновлена" : "Запись добавлена", variant: "success" });
    setSheetOpen(false);
    setEditingLog(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    const deletedLog = deleteTarget;
    setIsDeleting(true);
    setLogs((current) => current.filter((log) => log.id !== deletedLog.id));
    setDeleteTarget(null);

    const result = await deleteGlucoseLogAction(deletedLog.id);
    setIsDeleting(false);

    if (result.error) {
      setLogs((current) => sortGlucoseLogs([deletedLog, ...current]));
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setToast({ message: "Запись удалена", variant: "success" });
  }

  function openCreateSheet() {
    setEditingLog(null);
    setSheetOpen(true);
  }

  function openEditSheet(log: GlucoseLog) {
    setEditingLog(log);
    setSheetOpen(true);
  }

  return (
    <PageContainer>
      <AppHeader title="Сахар и еда" />
      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      <section className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Последний" value={stats.last} />
        <StatCard label="Среднее" value={stats.avg} />
        <StatCard
          label="Повышено"
          value={stats.highCount}
          hint={stats.highCount > 0 ? "за день" : undefined}
        />
      </section>

      <section className="mb-24">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : logs.length === 0 ? (
          <EmptyState
            title="Нет измерений за этот день"
            description="Добавьте запись сахара за выбранную дату."
            action={
              <Button onClick={openCreateSheet}>
                <Plus size={18} weight="bold" />
                Добавить
              </Button>
            }
          />
        ) : (
          <GlucoseList logs={logs} onEdit={openEditSheet} onDelete={setDeleteTarget} />
        )}
      </section>

      <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg">
        <Button className="w-full shadow-lg shadow-primary/20" onClick={openCreateSheet}>
          <Plus size={20} weight="bold" />
          Добавить сахар
        </Button>
      </div>

      <BottomSheet
        open={sheetOpen}
        title={editingLog ? "Редактировать" : "Добавить сахар"}
        onClose={() => {
          setSheetOpen(false);
          setEditingLog(null);
        }}
      >
        <GlucoseForm
          initialData={editingLog ?? undefined}
          defaultMeasuredAt={getDefaultMeasuredAt(parseDateKey(dateKey))}
          onSubmit={handleSubmit}
          onCancel={() => {
            setSheetOpen(false);
            setEditingLog(null);
          }}
        />
      </BottomSheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить запись?"
        description="Это действие нельзя отменить."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </PageContainer>
  );
}
