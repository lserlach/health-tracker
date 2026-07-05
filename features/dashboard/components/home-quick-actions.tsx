"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cookie, ForkKnife, Heartbeat, Pill, Scales } from "@phosphor-icons/react";
import { saveBloodPressureLogAction } from "@/features/blood-pressure/actions/blood-pressure-actions";
import {
  bloodPressureFormSchema,
  type BloodPressureFormValues,
} from "@/features/blood-pressure/lib/validation";
import { saveGlucoseLogAction } from "@/features/glucose/actions/glucose-actions";
import { GlucoseForm } from "@/features/glucose/components/glucose-form";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";
import { saveMealLogAction } from "@/features/meals/actions/meal-actions";
import { MealForm } from "@/features/meals/components/meal-form";
import type { MealFormValues } from "@/features/meals/lib/validation";
import { updateMedicationLogStatusAction } from "@/features/medications/actions/medication-log-actions";
import { MedicationChecklist } from "@/features/medications/components/medication-checklist";
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import type { GlucoseLog } from "@/types/database.types";
import { saveWeightLogAction } from "@/features/weight/actions/weight-actions";
import {
  weightFormSchema,
  type WeightFormValues,
} from "@/features/weight/lib/validation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { DatetimePickerField } from "@/components/ui/datetime-picker-field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import { cn } from "@/lib/utils/cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

type SheetType = "glucose" | "meal" | "medication" | "blood_pressure" | "weight" | null;

interface HomeQuickActionsProps {
  medicationLogs: MedicationLogWithMedication[];
  todayGlucoseLogs: GlucoseLog[];
}

const actionButtonClassName = cn(
  "flex h-auto min-h-[6rem] w-full flex-col items-center justify-center gap-1.5 rounded-(--radius-button) bg-primary-soft/45 px-3 py-4 text-xs font-normal text-primary/70 transition-colors hover:bg-primary-soft/65",
);

export function HomeQuickActions({ medicationLogs, todayGlucoseLogs }: HomeQuickActionsProps) {
  const router = useRouter();
  const [, startHomeRefresh] = useTransition();
  const inFlightMedIds = useRef(new Set<string>());
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [localMedicationLogs, setLocalMedicationLogs] = useState(medicationLogs);
  const [formError, setFormError] = useState<string | null>(null);
  const [medicationError, setMedicationError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  useEffect(() => {
    if (inFlightMedIds.current.size > 0) return;
    setLocalMedicationLogs(medicationLogs);
  }, [medicationLogs]);

  const weightForm = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      weight: 0,
    },
  });

  const bpForm = useForm<BloodPressureFormValues>({
    resolver: zodResolver(bloodPressureFormSchema),
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      systolic: Number.NaN,
      diastolic: Number.NaN,
      pulse: "",
    },
  });

  function closeSheet() {
    setActiveSheet(null);
    setFormError(null);
    setMedicationError(null);
    weightForm.reset({ measured_at: toDatetimeLocalValue(), weight: 0 });
    bpForm.reset({
      measured_at: toDatetimeLocalValue(),
      systolic: Number.NaN,
      diastolic: Number.NaN,
      pulse: "",
    });
  }

  function refreshHomeInBackground() {
    startHomeRefresh(() => {
      router.refresh();
    });
  }

  async function handleGlucoseSubmit(values: GlucoseFormValues) {
    closeSheet();
    setToast({ message: "Сахар добавлен", variant: "success" });

    void saveGlucoseLogAction(values).then((result) => {
      if (result.error) {
        setToast({ message: result.error, variant: "error" });
        return;
      }
      refreshHomeInBackground();
    });
  }

  async function handleMealSubmit(values: MealFormValues) {
    closeSheet();
    setToast({
      message: "Еда добавлена. Напоминание о сахаре через 1 час.",
      variant: "success",
    });

    void saveMealLogAction(values).then((result) => {
      if (result.error) {
        setToast({ message: result.error, variant: "error" });
        return;
      }
      refreshHomeInBackground();
    });
  }

  async function handleWeightSubmit(values: WeightFormValues) {
    setFormError(null);
    closeSheet();
    setToast({ message: "Вес добавлен", variant: "success" });

    void saveWeightLogAction(values).then((result) => {
      if (result.error) {
        setToast({ message: result.error, variant: "error" });
        return;
      }
      refreshHomeInBackground();
    });
  }

  async function handleBloodPressureSubmit(values: BloodPressureFormValues) {
    setFormError(null);
    closeSheet();
    setToast({ message: "Давление добавлено", variant: "success" });

    void saveBloodPressureLogAction(values).then((result) => {
      if (result.error) {
        setToast({ message: result.error, variant: "error" });
        return;
      }
      refreshHomeInBackground();
    });
  }

  async function setMedicationStatus(
    log: MedicationLogWithMedication,
    status: MedicationLogWithMedication["status"],
  ) {
    if (inFlightMedIds.current.has(log.id)) return;

    const previousLogs = localMedicationLogs;
    const takenAt = status === "taken" ? log.scheduled_for : null;

    inFlightMedIds.current.add(log.id);
    setLocalMedicationLogs((current) =>
      current.map((item) =>
        item.id === log.id ? { ...item, status, taken_at: takenAt } : item,
      ),
    );

    const result = await updateMedicationLogStatusAction(
      log.id,
      status,
      takenAt ?? undefined,
    );

    inFlightMedIds.current.delete(log.id);

    if (result.error) {
      setLocalMedicationLogs(previousLogs);
      setMedicationError(result.error);
      return;
    }

    setMedicationError(null);
  }

  function toggleMedicationTaken(log: MedicationLogWithMedication) {
    void setMedicationStatus(log, log.status === "taken" ? "pending" : "taken");
  }

  function toggleMedicationSkipped(log: MedicationLogWithMedication) {
    void setMedicationStatus(log, log.status === "skipped" ? "pending" : "skipped");
  }

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Быстрое добавление</h2>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <button type="button" className={actionButtonClassName} onClick={() => setActiveSheet("glucose")}>
            <Cookie size={30} weight="fill" className="text-primary" />
            <span>Сахар</span>
          </button>
          <button type="button" className={actionButtonClassName} onClick={() => setActiveSheet("meal")}>
            <ForkKnife size={30} weight="fill" className="text-primary" />
            <span>Еда</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => setActiveSheet("medication")}
          >
            <Pill size={30} weight="fill" className="text-primary" />
            <span>Лекарство</span>
          </button>
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => setActiveSheet("blood_pressure")}
          >
            <Heartbeat size={30} weight="fill" className="text-primary" />
            <span>Давление</span>
          </button>
          <button type="button" className={actionButtonClassName} onClick={() => setActiveSheet("weight")}>
            <Scales size={30} weight="fill" className="text-primary" />
            <span>Вес</span>
          </button>
        </div>
      </section>

      <BottomSheet open={activeSheet === "glucose"} title="Добавить сахар" onClose={closeSheet}>
        <GlucoseForm
          defaultMeasurementType="fasting"
          dayLogs={todayGlucoseLogs}
          onSubmit={handleGlucoseSubmit}
          onCancel={closeSheet}
        />
      </BottomSheet>

      <BottomSheet open={activeSheet === "meal"} title="Добавить еду" onClose={closeSheet}>
        <MealForm onSubmit={handleMealSubmit} onCancel={closeSheet} />
      </BottomSheet>

      <BottomSheet open={activeSheet === "weight"} title="Добавить вес" onClose={closeSheet}>
        <form className="space-y-4" onSubmit={weightForm.handleSubmit(handleWeightSubmit)}>
          <FormError message={formError} />
          <Controller
            name="measured_at"
            control={weightForm.control}
            render={({ field }) => (
              <DatetimePickerField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={weightForm.formState.errors.measured_at?.message}
              />
            )}
          />
          <Input
            label="Вес, кг"
            type="number"
            step="0.1"
            error={weightForm.formState.errors.weight?.message}
            {...weightForm.register("weight", { valueAsNumber: true })}
          />
          <Button type="submit" className="w-full">
            Сохранить
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === "blood_pressure"} title="Отметить давление" onClose={closeSheet}>
        <form className="space-y-4" onSubmit={bpForm.handleSubmit(handleBloodPressureSubmit)}>
          <FormError message={formError} />
          <Controller
            name="measured_at"
            control={bpForm.control}
            render={({ field }) => (
              <DatetimePickerField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={bpForm.formState.errors.measured_at?.message}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="systolic"
              control={bpForm.control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  label="Верхнее"
                  type="number"
                  inputMode="numeric"
                  placeholder="120"
                  error={bpForm.formState.errors.systolic?.message}
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
              control={bpForm.control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <Input
                  label="Нижнее"
                  type="number"
                  inputMode="numeric"
                  placeholder="80"
                  error={bpForm.formState.errors.diastolic?.message}
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
            error={bpForm.formState.errors.pulse?.message}
            {...bpForm.register("pulse")}
          />
          <Button type="submit" className="w-full">
            Сохранить
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === "medication"} title="Отметить лекарство" onClose={closeSheet}>
        {localMedicationLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">На сегодня нет лекарств в расписании.</p>
        ) : (
          <>
            <FormError message={medicationError} className="mb-3" />
            <MedicationChecklist
            logs={localMedicationLogs}
            onToggleTaken={toggleMedicationTaken}
            onToggleSkipped={toggleMedicationSkipped}
            className="border-0 bg-transparent p-0 shadow-none"
          />
          </>
        )}
      </BottomSheet>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
