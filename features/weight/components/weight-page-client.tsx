"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "@phosphor-icons/react";
import {
  deleteWeightLogAction,
  getWeightLogsForDayAction,
  saveWeightLogAction,
} from "@/features/weight/actions/weight-actions";
import { weightFormSchema, type WeightFormValues } from "@/features/weight/lib/validation";
import { formatDateTime, toDatetimeLocalValue } from "@/lib/dates/format";
import { getDefaultMeasuredAt, parseDateKey, toDateKey } from "@/lib/dates/day";
import type { WeightLog } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

  const load = useCallback(async () => {
    const result = await getWeightLogsForDayAction(dateKey);
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
    if (logs.length === 0) return { last: "—", count: 0 };
    return { last: Number(logs[0].weight).toFixed(1), count: logs.length };
  }, [logs]);

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
    }

    setToast({ message: editing ? "Запись обновлена" : "Запись добавлена", variant: "success" });
    setSheetOpen(false);
  }

  return (
    <PageContainer>
      <AppHeader title="Вес" />
      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      <section className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Вес за день" value={stats.last === "—" ? "—" : `${stats.last} кг`} />
        <StatCard label="Записей" value={stats.count} />
      </section>

      {logs.length === 0 ? (
        <EmptyState
          title="Нет записей за этот день"
          description="Добавьте измерение веса за выбранную дату."
          action={<Button onClick={() => openSheet()}>Добавить</Button>}
        />
      ) : (
        <div className="mb-24 space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold">{Number(log.weight).toFixed(1)} кг</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(log.measured_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="md" onClick={() => openSheet(log)}>
                    Изм.
                  </Button>
                  <Button variant="ghost" size="md" onClick={() => setDeleteTarget(log)}>
                    Удал.
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg">
        <Button className="w-full" onClick={() => openSheet()}>
          <Plus size={20} weight="bold" />
          Добавить вес
        </Button>
      </div>

      <BottomSheet
        open={sheetOpen}
        title={editing ? "Редактировать" : "Добавить вес"}
        onClose={() => setSheetOpen(false)}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Дата и время" type="datetime-local" {...form.register("measured_at")} />
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

          setToast({ message: "Запись удалена", variant: "success" });
        }}
      />

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
