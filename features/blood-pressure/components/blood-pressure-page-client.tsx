"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "@phosphor-icons/react";
import {
  deleteBloodPressureLogAction,
  getBloodPressureLogsForDayAction,
  saveBloodPressureLogAction,
} from "@/features/blood-pressure/actions/blood-pressure-actions";
import {
  bloodPressureFormSchema,
  isUnusualBloodPressure,
  type BloodPressureFormValues,
} from "@/features/blood-pressure/lib/validation";
import { formatDateTime, toDatetimeLocalValue } from "@/lib/dates/format";
import { getDefaultMeasuredAt, parseDateKey, toDateKey } from "@/lib/dates/day";
import type { BloodPressureLog } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

interface BloodPressurePageClientProps {
  minDateKey: string;
}

export function BloodPressurePageClient({ minDateKey }: BloodPressurePageClientProps) {
  const [dateKey, setDateKey] = useState(toDateKey());
  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BloodPressureLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BloodPressureLog | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const form = useForm<BloodPressureFormValues>({
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      systolic: 0,
      diastolic: 0,
      pulse: "",
    },
  });

  const load = useCallback(async () => {
    const result = await getBloodPressureLogsForDayAction(dateKey);
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

  function openSheet(log?: BloodPressureLog) {
    setEditing(log ?? null);
    form.reset(
      log
        ? {
            measured_at: toDatetimeLocalValue(new Date(log.measured_at)),
            systolic: log.systolic,
            diastolic: log.diastolic,
            pulse: log.pulse != null ? String(log.pulse) : "",
          }
        : {
            measured_at: getDefaultMeasuredAt(parseDateKey(dateKey)),
            systolic: 0,
            diastolic: 0,
            pulse: "",
          },
    );
    setSheetOpen(true);
  }

  async function onSubmit(values: BloodPressureFormValues) {
    const parsed = bloodPressureFormSchema.safeParse(values);
    if (!parsed.success) {
      setToast({ message: "Проверьте введённые значения", variant: "error" });
      return;
    }

    const result = await saveBloodPressureLogAction(parsed.data, editing?.id);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setToast({ message: editing ? "Запись обновлена" : "Запись добавлена", variant: "success" });
    setSheetOpen(false);
    await load();
  }

  return (
    <PageContainer>
      <AppHeader title="Давление" />
      <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />

      {logs.length === 0 ? (
        <EmptyState
          title="Нет измерений за этот день"
          description="Добавьте измерение давления за выбранную дату."
          action={<Button onClick={() => openSheet()}>Добавить</Button>}
        />
      ) : (
        <div className="mb-24 space-y-3">
          {logs.map((log) => {
            const unusual = isUnusualBloodPressure(log.systolic, log.diastolic);
            return (
              <Card key={log.id} className={unusual ? "border-warning bg-warning/20" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold">
                      {log.systolic}/{log.diastolic}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(log.measured_at)}
                      {log.pulse ? ` · пульс ${log.pulse}` : ""}
                    </p>
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
                {unusual ? <Badge variant="warning">Нетипичное значение</Badge> : null}
              </Card>
            );
          })}
        </div>
      )}

      <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg">
        <Button className="w-full" onClick={() => openSheet()}>
          <Plus size={20} weight="bold" />
          Добавить давление
        </Button>
      </div>

      <BottomSheet
        open={sheetOpen}
        title={editing ? "Редактировать" : "Добавить давление"}
        onClose={() => setSheetOpen(false)}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Дата и время" type="datetime-local" {...form.register("measured_at")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Верхнее" type="number" {...form.register("systolic", { valueAsNumber: true })} />
            <Input label="Нижнее" type="number" {...form.register("diastolic", { valueAsNumber: true })} />
          </div>
          <Input label="Пульс (необязательно)" type="number" {...form.register("pulse")} />
          <Button type="submit" className="w-full">
            Сохранить
          </Button>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить запись?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteBloodPressureLogAction(deleteTarget.id);
          if (result.error) {
            setToast({ message: result.error, variant: "error" });
            return;
          }
          setDeleteTarget(null);
          await load();
          setToast({ message: "Запись удалена", variant: "success" });
        }}
      />

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
