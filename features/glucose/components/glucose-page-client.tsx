"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import {
  deleteGlucoseLogAction,
  getGlucoseDayDataAction,
  saveGlucoseLogAction,
} from "@/features/glucose/actions/glucose-actions";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";
import { GlucoseDayList } from "@/features/glucose/components/glucose-day-list";
import { GlucoseForm } from "@/features/glucose/components/glucose-form";
import type { GlucoseLog, MealLog } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { FixedBottomAction } from "@/components/layout/fixed-bottom-action";
import { PageContainer } from "@/components/layout/page-container";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [pendingMeals, setPendingMeals] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<GlucoseLog | null>(null);
  const [pendingMealTarget, setPendingMealTarget] = useState<MealLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlucoseLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const loadDayData = useCallback(async () => {
    setIsLoading(true);
    const result = await getGlucoseDayDataAction(dateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setLogs([]);
      setPendingMeals([]);
    } else {
      setLogs(result.logs);
      setPendingMeals(result.pendingMeals);
    }
    setIsLoading(false);
  }, [dateKey]);

  useEffect(() => {
    void loadDayData();
  }, [loadDayData]);

  function closeSheet() {
    setSheetOpen(false);
    setEditingLog(null);
    setPendingMealTarget(null);
  }

  async function handleSubmit(values: GlucoseFormValues) {
    const result = await saveGlucoseLogAction(values, editingLog?.id, {
      mealLogId: pendingMealTarget?.id,
      eatenAt: pendingMealTarget?.eaten_at,
    });

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

      if (pendingMealTarget) {
        setPendingMeals((current) =>
          current.filter((meal) => meal.id !== pendingMealTarget.id),
        );
      }
    }

    setToast({ message: editingLog ? "Запись обновлена" : "Запись добавлена", variant: "success" });
    closeSheet();
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

    await loadDayData();
    setToast({ message: "Запись удалена", variant: "success" });
  }

  function openCreateSheet() {
    setEditingLog(null);
    setPendingMealTarget(null);
    setSheetOpen(true);
  }

  function openEditSheet(log: GlucoseLog) {
    setEditingLog(log);
    setPendingMealTarget(null);
    setSheetOpen(true);
  }

  function openPendingMealSheet(meal: MealLog) {
    setEditingLog(null);
    setPendingMealTarget(meal);
    setSheetOpen(true);
  }

  const hasEntries = logs.length > 0 || pendingMeals.length > 0;

  return (
    <PageContainer>
      <AppHeader title="Измерение сахара" />
      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      <section>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : !hasEntries ? (
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
          <GlucoseDayList
            logs={logs}
            pendingMeals={pendingMeals}
            onEdit={openEditSheet}
            onDelete={setDeleteTarget}
            onMeasurePending={openPendingMealSheet}
          />
        )}
      </section>

      <FixedBottomAction>
        <Button className="w-full shadow-lg shadow-primary/20" onClick={openCreateSheet}>
          <Plus size={16} weight="bold" />
          Добавить сахар
        </Button>
      </FixedBottomAction>

      <BottomSheet open={sheetOpen} title={null} onClose={closeSheet}>
        <GlucoseForm
          initialData={editingLog ?? undefined}
          pendingMeal={pendingMealTarget ?? undefined}
          defaultMeasuredAt={getDefaultMeasuredAt(parseDateKey(dateKey))}
          dayLogs={logs}
          onSubmit={handleSubmit}
          onCancel={closeSheet}
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
