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
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { Toast } from "@/components/ui/toast";
import { getDefaultMeasuredAt, parseDateKey, toDateKey } from "@/lib/dates/day";

interface GlucosePageClientProps {
  minDateKey: string;
  initialDateKey: string;
  initialLogs: GlucoseLog[];
  initialPendingMeals: MealLog[];
}

interface GlucoseDayData {
  logs: GlucoseLog[];
  pendingMeals: MealLog[];
}

function sortGlucoseLogs(logs: GlucoseLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );
}

export function GlucosePageClient({
  minDateKey,
  initialDateKey,
  initialLogs,
  initialPendingMeals,
}: GlucosePageClientProps) {
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [dayDataByDate, setDayDataByDate] = useState<Record<string, GlucoseDayData>>({
    [initialDateKey]: {
      logs: initialLogs,
      pendingMeals: initialPendingMeals,
    },
  });
  const [loadingDateKey, setLoadingDateKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<GlucoseLog | null>(null);
  const [pendingMealTarget, setPendingMealTarget] = useState<MealLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlucoseLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const loadDayData = useCallback(async (targetDateKey: string) => {
    setLoadingDateKey(targetDateKey);
    const result = await getGlucoseDayDataAction(targetDateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setDayDataByDate((current) => ({
        ...current,
        [targetDateKey]: { logs: [], pendingMeals: [] },
      }));
    } else {
      setDayDataByDate((current) => ({
        ...current,
        [targetDateKey]: {
          logs: result.logs,
          pendingMeals: result.pendingMeals,
        },
      }));
    }
    setLoadingDateKey(null);
  }, []);

  useEffect(() => {
    if (dayDataByDate[dateKey] !== undefined) return;
    void loadDayData(dateKey);
  }, [dateKey, dayDataByDate, loadDayData]);

  const dayData = dayDataByDate[dateKey];
  const logs = dayData?.logs ?? [];
  const pendingMeals = dayData?.pendingMeals ?? [];
  const isLoading = dayData === undefined || loadingDateKey === dateKey;

  function closeSheet() {
    setSheetOpen(false);
    setEditingLog(null);
    setPendingMealTarget(null);
  }

  async function handleSubmit(values: GlucoseFormValues) {
    const currentEditingLog = editingLog;
    const currentPendingMealTarget = pendingMealTarget;

    closeSheet();

    const result = await saveGlucoseLogAction(values, currentEditingLog?.id, {
      mealLogId: currentPendingMealTarget?.id,
      eatenAt: currentPendingMealTarget?.eaten_at,
    });

    if (result.error) {
      setEditingLog(currentEditingLog);
      setPendingMealTarget(currentPendingMealTarget);
      setSheetOpen(true);
      return { error: result.error };
    }

    if (result.data) {
      setDayDataByDate((current) => {
        const currentDay = current[dateKey] ?? { logs: [], pendingMeals: [] };
        const nextLogs = sortGlucoseLogs(
          currentEditingLog
            ? currentDay.logs.map((log) =>
                log.id === currentEditingLog.id ? result.data! : log,
              )
            : [result.data!, ...currentDay.logs],
        );
        const nextPendingMeals = currentPendingMealTarget
          ? currentDay.pendingMeals.filter((meal) => meal.id !== currentPendingMealTarget.id)
          : currentDay.pendingMeals;

        return {
          ...current,
          [dateKey]: {
            logs: nextLogs,
            pendingMeals: nextPendingMeals,
          },
        };
      });
    }

    setToast({ message: currentEditingLog ? "Запись обновлена" : "Запись добавлена", variant: "success" });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    const deletedLog = deleteTarget;
    setIsDeleting(true);
    setDayDataByDate((current) => {
      const currentDay = current[dateKey] ?? { logs: [], pendingMeals: [] };
      return {
        ...current,
        [dateKey]: {
          ...currentDay,
          logs: currentDay.logs.filter((log) => log.id !== deletedLog.id),
        },
      };
    });
    setDeleteTarget(null);

    const result = await deleteGlucoseLogAction(deletedLog.id);
    setIsDeleting(false);

    if (result.error) {
      setDayDataByDate((current) => {
        const currentDay = current[dateKey] ?? { logs: [], pendingMeals: [] };
        return {
          ...current,
          [dateKey]: {
            ...currentDay,
            logs: sortGlucoseLogs([deletedLog, ...currentDay.logs]),
          },
        };
      });
      setToast({ message: result.error, variant: "error" });
      return;
    }

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
          <PageLoadingState />
        ) : !hasEntries ? (
          <EmptyState
            title="Нет измерений за этот день"
            description="Добавьте запись сахара за выбранную дату."
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
