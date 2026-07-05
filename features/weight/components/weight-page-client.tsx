"use client";

import { useCallback, useEffect, useState } from "react";
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
import type { WeightLog } from "@/types/database.types";
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
import { StatCard } from "@/components/ui/stat-card";
import { Toast } from "@/components/ui/toast";

interface WeightPageClientProps {
  minDateKey: string;
}

function sortWeightLogs(logs: WeightLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );
}

export function WeightPageClient({ minDateKey }: WeightPageClientProps) {
  const [dateKey, setDateKey] = useState(toDateKey());
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weightStats, setWeightStats] = useState<{ gain7Days: number | null; gainAllTime: number | null }>({
    gain7Days: null,
    gainAllTime: null,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WeightLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeightLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const form = useForm<WeightFormValues>({
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      weight: 0,
    },
  });
  const { control } = form;

  const load = useCallback(async () => {
    const [logsResult, statsResult] = await Promise.all([
      getWeightLogsForDayAction(dateKey),
      getWeightStatsAction(dateKey),
    ]);

    if (logsResult.error) {
      setToast({ message: logsResult.error, variant: "error" });
      setLogs([]);
    } else {
      setLogs(logsResult.data);
    }

    if (statsResult.error) {
      setToast({ message: statsResult.error, variant: "error" });
      setWeightStats({ gain7Days: null, gainAllTime: null });
    } else if (statsResult.data) {
      setWeightStats(statsResult.data);
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function openSheet(log?: WeightLog) {
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
    const parsed = weightFormSchema.safeParse(values);
    if (!parsed.success) {
      setToast({ message: "Проверьте введённые значения", variant: "error" });
      return;
    }

    setIsSubmitting(true);
    const result = await saveWeightLogAction(parsed.data, editing?.id);
    setIsSubmitting(false);

    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    if (result.data) {
      setLogs((current) =>
        sortWeightLogs(
          editing
            ? current.map((log) => (log.id === editing.id ? result.data! : log))
            : [result.data, ...current],
        ),
      );

      const statsResult = await getWeightStatsAction(dateKey);
      if (statsResult.data) {
        setWeightStats(statsResult.data);
      }
    }

    setToast({ message: editing ? "Запись обновлена" : "Запись добавлена", variant: "success" });
    setSheetOpen(false);
  }

  return (
    <PageContainer>
      <AppHeader title="Вес" />
      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      <section className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          label="Прибавка за 7 дней"
          value={formatWeightDelta(weightStats.gain7Days)}
        />
        <StatCard label="За всё время" value={formatWeightDelta(weightStats.gainAllTime)} />
      </section>

      {logs.length === 0 ? (
        <EmptyState
          title="Нет записей за этот день"
          description="Добавьте измерение веса за выбранную дату."
          action={<Button onClick={() => openSheet()}>Добавить</Button>}
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
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
          <Controller
            name="measured_at"
            control={control}
            render={({ field }) => (
              <DatetimePickerField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Input label="Вес, кг" type="number" step="0.1" {...form.register("weight", { valueAsNumber: true })} />
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
          setLogs((current) => current.filter((log) => log.id !== deletedLog.id));
          setDeleteTarget(null);

          const result = await deleteWeightLogAction(deletedLog.id);
          if (result.error) {
            setLogs((current) => sortWeightLogs([deletedLog, ...current]));
            setToast({ message: result.error, variant: "error" });
            return;
          }

          const statsResult = await getWeightStatsAction(dateKey);
          if (statsResult.data) {
            setWeightStats(statsResult.data);
          }

          setToast({ message: "Запись удалена", variant: "success" });
        }}
      />

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
