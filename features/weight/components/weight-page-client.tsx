"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Plus } from "@phosphor-icons/react";
import {
  deleteWeightLogAction,
  getWeightLogsForDayAction,
  getWeightStatsAction,
  saveWeightLogAction,
} from "@/features/weight/actions/weight-actions";
import { formatWeightDelta } from "@/features/weight/lib/weight-stats";
import { weightFormSchema, type WeightFormValues } from "@/features/weight/lib/validation";
import { formatTime, toDatetimeLocalValue } from "@/lib/dates/format";
import { getDefaultMeasuredAt, parseDateKey, toDateKey } from "@/lib/dates/day";
import type { WeightStats } from "@/features/weight/actions/weight-actions";
import { AppHeader } from "@/components/layout/app-header";
import { FixedBottomAction } from "@/components/layout/fixed-bottom-action";
import { PageContainer } from "@/components/layout/page-container";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { RecordActionButtons } from "@/components/ui/record-action-buttons";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatetimePickerField } from "@/components/ui/datetime-picker-field";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { StatCard } from "@/components/ui/stat-card";
import { Toast } from "@/components/ui/toast";
import type { WeightLog } from "@/types/database.types";

interface WeightPageClientProps {
  minDateKey: string;
  initialDateKey: string;
  initialLogs: WeightLog[];
  initialStats: WeightStats;
}

function sortWeightLogs(logs: WeightLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );
}

export function WeightPageClient({
  minDateKey,
  initialDateKey,
  initialLogs,
  initialStats,
}: WeightPageClientProps) {
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [logsByDate, setLogsByDate] = useState<Record<string, WeightLog[]>>({
    [initialDateKey]: initialLogs,
  });
  const [statsByDate, setStatsByDate] = useState<Record<string, WeightStats>>({
    [initialDateKey]: initialStats,
  });
  const [loadingDateKey, setLoadingDateKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WeightLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeightLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      weight: 0,
    },
  });
  const { control, formState: { errors } } = form;

  const load = useCallback(async (targetDateKey: string) => {
    setLoadingDateKey(targetDateKey);

    const [logsResult, statsResult] = await Promise.all([
      getWeightLogsForDayAction(targetDateKey),
      getWeightStatsAction(targetDateKey),
    ]);

    if (logsResult.error) {
      setToast({ message: logsResult.error, variant: "error" });
      setLogsByDate((current) => ({ ...current, [targetDateKey]: [] }));
    } else {
      setLogsByDate((current) => ({ ...current, [targetDateKey]: logsResult.data }));
    }

    if (statsResult.error) {
      setStatsByDate((current) => ({
        ...current,
        [targetDateKey]: { gain7Days: null, gainAllTime: null },
      }));
    } else if (statsResult.data) {
      setStatsByDate((current) => ({ ...current, [targetDateKey]: statsResult.data! }));
    }

    setLoadingDateKey(null);
  }, []);

  useEffect(() => {
    if (logsByDate[dateKey] !== undefined && statsByDate[dateKey] !== undefined) return;
    void load(dateKey);
  }, [dateKey, logsByDate, statsByDate, load]);

  const logs = logsByDate[dateKey];
  const weightStats = statsByDate[dateKey];
  const isLoading =
    logs === undefined ||
    weightStats === undefined ||
    loadingDateKey === dateKey;

  function openSheet(log?: WeightLog) {
    setFormError(null);
    setEditing(log ?? null);
    form.reset(
      log
        ? {
            measured_at: toDatetimeLocalValue(new Date(log.measured_at)),
            weight: log.weight,
          }
        : {
            measured_at: getDefaultMeasuredAt(parseDateKey(dateKey)),
            weight: 0,
          },
    );
    setSheetOpen(true);
  }

  async function onSubmit(values: WeightFormValues) {
    setFormError(null);
    const currentEditing = editing;
    setSheetOpen(false);
    setIsSubmitting(true);

    const result = await saveWeightLogAction(values, currentEditing?.id);
    setIsSubmitting(false);

    if (result.error) {
      setEditing(currentEditing);
      setSheetOpen(true);
      setFormError(result.error);
      return;
    }

    if (result.data) {
      const savedDateKey = toDateKey(new Date(result.data.measured_at));

      setLogsByDate((current) => {
        const updated = { ...current };
        for (const key of Object.keys(updated)) {
          updated[key] = updated[key].filter((log) => log.id !== result.data!.id);
        }
        const targetLogs = updated[savedDateKey] ?? [];
        updated[savedDateKey] = sortWeightLogs([result.data!, ...targetLogs]);
        return updated;
      });

      void getWeightStatsAction(dateKey).then((statsResult) => {
        if (statsResult.data) {
          setStatsByDate((current) => ({ ...current, [dateKey]: statsResult.data! }));
        }
      });
    }

    setToast({ message: currentEditing ? "Запись обновлена" : "Запись добавлена", variant: "success" });
  }

  return (
    <PageContainer>
      <AppHeader title="Вес" />
      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      <section className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          label="Прибавка за 7 дней"
          value={formatWeightDelta(weightStats?.gain7Days ?? null)}
        />
        <StatCard label="За всё время" value={formatWeightDelta(weightStats?.gainAllTime ?? null)} />
      </section>

      {isLoading ? (
        <PageLoadingState />
      ) : (logs ?? []).length === 0 ? (
        <EmptyState
          title="Нет записей за этот день"
          description="Добавьте измерение веса за выбранную дату."
        />
      ) : (
        <div className="space-y-3">
          {(logs ?? []).map((log) => (
            <Card key={log.id} className="border-0 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl font-semibold">{Number(log.weight).toFixed(1)} кг</p>
                  <p className="text-sm text-muted-foreground">{formatTime(log.measured_at)}</p>
                </div>
                <RecordActionButtons
                  onEdit={() => openSheet(log)}
                  onDelete={() => setDeleteTarget(log)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <FixedBottomAction>
        <Button className="w-full shadow-lg shadow-primary/20" onClick={() => openSheet()}>
          <Plus size={16} weight="bold" />
          Добавить вес
        </Button>
      </FixedBottomAction>

      <BottomSheet
        open={sheetOpen}
        title={editing ? "Редактировать" : "Добавить вес"}
        onClose={() => setSheetOpen(false)}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormError message={formError} />
          <Controller
            name="measured_at"
            control={control}
            render={({ field }) => (
              <DatetimePickerField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.measured_at?.message}
              />
            )}
          />
          <Input
            label="Вес, кг"
            type="number"
            step="0.1"
            error={errors.weight?.message}
            {...form.register("weight", { valueAsNumber: true })}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : "Сохранить"}
          </Button>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить запись?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;

          const deletedLog = deleteTarget;
          setLogsByDate((current) =>
            Object.fromEntries(
              Object.entries(current).map(([key, dayLogs]) => [
                key,
                dayLogs.filter((log) => log.id !== deletedLog.id),
              ]),
            ),
          );
          setDeleteTarget(null);

          const result = await deleteWeightLogAction(deletedLog.id);
          if (result.error) {
            const deletedDateKey = toDateKey(new Date(deletedLog.measured_at));
            setLogsByDate((current) => {
              const dayLogs = current[deletedDateKey] ?? [];
              return {
                ...current,
                [deletedDateKey]: sortWeightLogs([deletedLog, ...dayLogs]),
              };
            });
            setToast({ message: result.error, variant: "error" });
            return;
          }

          void getWeightStatsAction(dateKey).then((statsResult) => {
            if (statsResult.data) {
              setStatsByDate((current) => ({ ...current, [dateKey]: statsResult.data! }));
            }
          });

          setToast({ message: "Запись удалена", variant: "success" });
        }}
      />

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
