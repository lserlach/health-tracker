"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ListBullets, Plus } from "@phosphor-icons/react";
import {
  deleteBloodPressureLogAction,
  getAllBloodPressureLogsAction,
  getBloodPressureLogsForDayAction,
  saveBloodPressureLogAction,
} from "@/features/blood-pressure/actions/blood-pressure-actions";
import { BloodPressureAllLogsList } from "@/features/blood-pressure/components/blood-pressure-all-logs-list";
import { BloodPressureLogCard } from "@/features/blood-pressure/components/blood-pressure-log-card";
import {
  bloodPressureFormSchema,
  type BloodPressureFormValues,
} from "@/features/blood-pressure/lib/validation";
import { formatTime, toDatetimeLocalValue } from "@/lib/dates/format";
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
import { FormError } from "@/components/ui/form-error";
import { PageLoadingState } from "@/components/ui/page-loading-state";
import { Toast } from "@/components/ui/toast";

interface BloodPressurePageClientProps {
  minDateKey: string;
  initialDateKey: string;
  initialDayLogs: BloodPressureLog[];
}

type ViewMode = "day" | "all";

function sortBloodPressureLogs(logs: BloodPressureLog[]) {
  return [...logs].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );
}

const headerIconButtonClassName =
  "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary";

export function BloodPressurePageClient({
  minDateKey,
  initialDateKey,
  initialDayLogs,
}: BloodPressurePageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [logsByDate, setLogsByDate] = useState<Record<string, BloodPressureLog[]>>({
    [initialDateKey]: initialDayLogs,
  });
  const [allLogs, setAllLogs] = useState<BloodPressureLog[] | null>(null);
  const [loadingDayDateKey, setLoadingDayDateKey] = useState<string | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BloodPressureLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BloodPressureLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const form = useForm<BloodPressureFormValues>({
    resolver: zodResolver(bloodPressureFormSchema),
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      systolic: Number.NaN,
      diastolic: Number.NaN,
      pulse: "",
    },
  });
  const { control, formState: { errors } } = form;

  const loadDayLogs = useCallback(async (targetDateKey: string) => {
    setLoadingDayDateKey(targetDateKey);
    const result = await getBloodPressureLogsForDayAction(targetDateKey);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setLogsByDate((current) => ({ ...current, [targetDateKey]: [] }));
    } else {
      setLogsByDate((current) => ({ ...current, [targetDateKey]: result.data }));
    }
    setLoadingDayDateKey(null);
  }, []);

  const loadAllLogs = useCallback(async () => {
    setIsLoadingAll(true);
    const result = await getAllBloodPressureLogsAction();
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setAllLogs([]);
    } else {
      setAllLogs(result.data);
    }
    setIsLoadingAll(false);
  }, []);

  useEffect(() => {
    if (viewMode !== "day") return;
    if (logsByDate[dateKey] !== undefined) return;
    void loadDayLogs(dateKey);
  }, [viewMode, dateKey, logsByDate, loadDayLogs]);

  useEffect(() => {
    if (viewMode !== "all") return;
    if (allLogs !== null) return;
    void loadAllLogs();
  }, [viewMode, allLogs, loadAllLogs]);

  function openSheet(log?: BloodPressureLog) {
    setFormError(null);
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
    const savedDateKey = toDateKey(new Date(savedLog.measured_at));

    setAllLogs((current) =>
      sortBloodPressureLogs(
        isEdit
          ? (current ?? []).map((log) => (log.id === savedLog.id ? savedLog : log))
          : [savedLog, ...(current ?? [])],
      ),
    );

    setLogsByDate((current) => {
      const updated = { ...current };

      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].filter((log) => log.id !== savedLog.id);
      }

      const targetLogs = updated[savedDateKey] ?? [];
      updated[savedDateKey] = sortBloodPressureLogs([savedLog, ...targetLogs]);

      return updated;
    });
  }

  function removeLogFromCollections(deletedLog: BloodPressureLog) {
    setAllLogs((current) => (current ?? []).filter((log) => log.id !== deletedLog.id));
    setLogsByDate((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, logs]) => [
          key,
          logs.filter((log) => log.id !== deletedLog.id),
        ]),
      ),
    );
  }

  async function onSubmit(values: BloodPressureFormValues) {
    setFormError(null);
    const currentEditing = editing;
    setSheetOpen(false);
    setIsSubmitting(true);

    const result = await saveBloodPressureLogAction(values, currentEditing?.id);
    setIsSubmitting(false);

    if (result.error) {
      setEditing(currentEditing);
      setSheetOpen(true);
      setFormError(result.error);
      return;
    }

    if (result.data) {
      updateLogCollections(result.data, Boolean(currentEditing));
    }

    setToast({ message: currentEditing ? "Запись обновлена" : "Запись добавлена", variant: "success" });
  }

  const dayLogs = logsByDate[dateKey];
  const isLoadingDay = viewMode === "day" && (dayLogs === undefined || loadingDayDateKey === dateKey);
  const isLoading = isLoadingDay || (viewMode === "all" && (isLoadingAll || allLogs === null));
  const visibleLogs = viewMode === "day" ? (dayLogs ?? []) : (allLogs ?? []);

  return (
    <PageContainer>
      <AppHeader
        title="Давление"
        actions={
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
        }
      />

      {viewMode === "day" ? (
        <DayNavigator dateKey={dateKey} minDateKey={minDateKey} onChange={setDateKey} />
      ) : null}

      {isLoading ? (
        <PageLoadingState />
      ) : visibleLogs.length === 0 ? (
        <EmptyState
          title={viewMode === "all" ? "Нет измерений" : "Нет измерений за этот день"}
          description={
            viewMode === "all"
              ? "Добавьте первое измерение давления."
              : "Добавьте измерение давления за выбранную дату."
          }
        />
      ) : viewMode === "all" ? (
        <BloodPressureAllLogsList
          logs={allLogs ?? []}
          onEdit={(log) => openSheet(log)}
          onDelete={(log) => setDeleteTarget(log)}
        />
      ) : (
        <div className="space-y-3">
          {(dayLogs ?? []).map((log) => (
            <BloodPressureLogCard
              key={log.id}
              log={log}
              timestampLabel={formatTime(log.measured_at)}
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
                  error={errors.systolic?.message}
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
                  error={errors.diastolic?.message}
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
          <Input
            label="Пульс"
            type="number"
            error={errors.pulse?.message}
            {...form.register("pulse")}
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
          removeLogFromCollections(deletedLog);
          setDeleteTarget(null);

          const result = await deleteBloodPressureLogAction(deletedLog.id);
          if (result.error) {
            if (viewMode === "all" && allLogs) {
              setAllLogs(sortBloodPressureLogs([deletedLog, ...allLogs]));
            }
            setLogsByDate((current) => {
              const deletedDateKey = toDateKey(new Date(deletedLog.measured_at));
              const dayLogsForDate = current[deletedDateKey] ?? [];
              return {
                ...current,
                [deletedDateKey]: sortBloodPressureLogs([deletedLog, ...dayLogsForDate]),
              };
            });
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
