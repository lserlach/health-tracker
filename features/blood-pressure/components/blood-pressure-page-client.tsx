"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ListBullets, Plus } from "@phosphor-icons/react";
import {
  deleteBloodPressureLogAction,
  getAllBloodPressureLogsAction,
  getBloodPressureLogsForDayAction,
  saveBloodPressureLogAction,
} from "@/features/blood-pressure/actions/blood-pressure-actions";
import { BloodPressureLogCard } from "@/features/blood-pressure/components/blood-pressure-log-card";
import {
  bloodPressureFormSchema,
  type BloodPressureFormValues,
} from "@/features/blood-pressure/lib/validation";
import { formatDateTime, formatTime, toDatetimeLocalValue } from "@/lib/dates/format";
import { getDefaultMeasuredAt, parseDateKey, toDateKey } from "@/lib/dates/day";
import { cn } from "@/lib/utils/cn";
import type { BloodPressureLog } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { FixedBottomAction } from "@/components/layout/fixed-bottom-action";
import { PageContainer } from "@/components/layout/page-container";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatetimePickerField } from "@/components/ui/datetime-picker-field";
import { DayNavigator } from "@/components/ui/day-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

interface BloodPressurePageClientProps {
  minDateKey: string;
}

type ViewMode = "day" | "all";

function sortBloodPressureLogs(logs: BloodPressureLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );
}

const headerIconButtonClassName =
  "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary";

export function BloodPressurePageClient({ minDateKey }: BloodPressurePageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [dateKey, setDateKey] = useState(toDateKey());
  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [allLogs, setAllLogs] = useState<BloodPressureLog[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BloodPressureLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BloodPressureLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const form = useForm<BloodPressureFormValues>({
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      systolic: Number.NaN,
      diastolic: Number.NaN,
      pulse: "",
    },
  });
  const { control } = form;

  const loadDayLogs = useCallback(async () => {
    const result = await getBloodPressureLogsForDayAction(dateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setLogs([]);
      return;
    }
    setLogs(result.data);
  }, [dateKey]);

  const loadAllLogs = useCallback(async () => {
    const result = await getAllBloodPressureLogsAction();
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setAllLogs([]);
      return;
    }
    setAllLogs(result.data);
  }, []);

  useEffect(() => {
    if (viewMode === "day") {
      void loadDayLogs();
    }
  }, [viewMode, loadDayLogs]);

  useEffect(() => {
    if (viewMode === "all") {
      void loadAllLogs();
    }
  }, [viewMode, loadAllLogs]);

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
            measured_at:
              viewMode === "day"
                ? getDefaultMeasuredAt(parseDateKey(dateKey))
                : toDatetimeLocalValue(),
            systolic: Number.NaN,
            diastolic: Number.NaN,
            pulse: "",
          },
    );
    setSheetOpen(true);
  }

  function updateLogCollections(savedLog: BloodPressureLog, isEdit: boolean) {
    setAllLogs((current) =>
      sortBloodPressureLogs(
        isEdit
          ? current.map((log) => (log.id === savedLog.id ? savedLog : log))
          : [savedLog, ...current],
      ),
    );

    const savedDateKey = toDateKey(new Date(savedLog.measured_at));
    if (savedDateKey === dateKey) {
      setLogs((current) =>
        sortBloodPressureLogs(
          isEdit
            ? current.map((log) => (log.id === savedLog.id ? savedLog : log))
            : [savedLog, ...current],
        ),
      );
    } else if (isEdit) {
      setLogs((current) => current.filter((log) => log.id !== savedLog.id));
    }
  }

  function removeLogFromCollections(deletedLog: BloodPressureLog) {
    setAllLogs((current) => current.filter((log) => log.id !== deletedLog.id));
    setLogs((current) => current.filter((log) => log.id !== deletedLog.id));
  }

  async function onSubmit(values: BloodPressureFormValues) {
    const parsed = bloodPressureFormSchema.safeParse(values);
    if (!parsed.success) {
      setToast({ message: "Проверьте введённые значения", variant: "error" });
      return;
    }

    setIsSubmitting(true);
    const result = await saveBloodPressureLogAction(parsed.data, editing?.id);
    setIsSubmitting(false);

    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    if (result.data) {
      updateLogCollections(result.data, Boolean(editing));
    }

    setToast({ message: editing ? "Запись обновлена" : "Запись добавлена", variant: "success" });
    setSheetOpen(false);
  }

  const visibleLogs = viewMode === "all" ? allLogs : logs;

  return (
    <PageContainer>
      <AppHeader
        title={
          <span className="flex items-center gap-2">
            <span>Давление</span>
            <button
              type="button"
              aria-label={viewMode === "all" ? "Показать по дням" : "Показать все измерения"}
              aria-pressed={viewMode === "all"}
              className={cn(
                headerIconButtonClassName,
                viewMode === "all" && "bg-primary-soft text-primary",
              )}
              onClick={() => setViewMode((current) => (current === "day" ? "all" : "day"))}
            >
              <ListBullets size={20} weight={viewMode === "all" ? "fill" : "regular"} />
            </button>
          </span>
        }
      />

      {viewMode === "day" ? (
        <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />
      ) : null}

      {visibleLogs.length === 0 ? (
        <EmptyState
          title={viewMode === "all" ? "Нет измерений" : "Нет измерений за этот день"}
          description={
            viewMode === "all"
              ? "Добавьте первое измерение давления."
              : "Добавьте измерение давления за выбранную дату."
          }
          action={<Button onClick={() => openSheet()}>Добавить</Button>}
        />
      ) : (
        <div className="space-y-3">
          {visibleLogs.map((log) => (
            <BloodPressureLogCard
              key={log.id}
              log={log}
              timestampLabel={viewMode === "all" ? formatDateTime(log.measured_at) : formatTime(log.measured_at)}
              onEdit={() => openSheet(log)}
              onDelete={() => setDeleteTarget(log)}
            />
          ))}
        </div>
      )}

      <FixedBottomAction>
        <Button className="w-full shadow-lg shadow-primary/20" onClick={() => openSheet()}>
          <Plus size={16} weight="bold" />
          Добавить давление
        </Button>
      </FixedBottomAction>

      <BottomSheet
        open={sheetOpen}
        title={editing ? "Редактировать" : "Добавить давление"}
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
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="systolic"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  label="Верхнее"
                  type="number"
                  inputMode="numeric"
                  placeholder="120"
                  ref={ref}
                  onBlur={onBlur}
                  value={Number.isNaN(value) ? "" : value}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onChange(nextValue === "" ? Number.NaN : Number(nextValue));
                  }}
                />
              )}
            />
            <Controller
              name="diastolic"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  label="Нижнее"
                  type="number"
                  inputMode="numeric"
                  placeholder="80"
                  ref={ref}
                  onBlur={onBlur}
                  value={Number.isNaN(value) ? "" : value}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onChange(nextValue === "" ? Number.NaN : Number(nextValue));
                  }}
                />
              )}
            />
          </div>
          <Input label="Пульс" type="number" {...form.register("pulse")} />
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
          removeLogFromCollections(deletedLog);
          setDeleteTarget(null);

          const result = await deleteBloodPressureLogAction(deletedLog.id);
          if (result.error) {
            if (viewMode === "all") {
              setAllLogs((current) => sortBloodPressureLogs([deletedLog, ...current]));
            }
            if (toDateKey(new Date(deletedLog.measured_at)) === dateKey) {
              setLogs((current) => sortBloodPressureLogs([deletedLog, ...current]));
            }
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
