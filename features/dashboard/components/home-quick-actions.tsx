"use client";

import { useMemo, useState } from "react";
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
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import { saveWeightLogAction } from "@/features/weight/actions/weight-actions";
import {
  weightFormSchema,
  type WeightFormValues,
} from "@/features/weight/lib/validation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { formatDateTime, toDatetimeLocalValue } from "@/lib/dates/format";
import { cn } from "@/lib/utils/cn";
import { useForm } from "react-hook-form";

type SheetType = "glucose" | "meal" | "medication" | "blood_pressure" | "weight" | null;

interface HomeQuickActionsProps {
  medicationLogs: MedicationLogWithMedication[];
}

const actionButtonClassName = cn(
  "flex h-auto min-h-[6rem] w-full flex-col items-center justify-center gap-1.5 rounded-(--radius-button) bg-primary-soft/45 px-3 py-4 text-xs font-normal text-primary/70 transition-colors hover:bg-primary-soft/65",
);

export function HomeQuickActions({ medicationLogs }: HomeQuickActionsProps) {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [pendingMedId, setPendingMedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const pendingMedications = useMemo(
    () =>
      [...medicationLogs]
        .filter((log) => log.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime(),
        ),
    [medicationLogs],
  );

  const weightForm = useForm<WeightFormValues>({
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      weight: 0,
    },
  });

  const bpForm = useForm<BloodPressureFormValues>({
    defaultValues: {
      measured_at: toDatetimeLocalValue(),
      systolic: 0,
      diastolic: 0,
      pulse: "",
    },
  });

  function closeSheet() {
    setActiveSheet(null);
    weightForm.reset({ measured_at: toDatetimeLocalValue(), weight: 0 });
    bpForm.reset({
      measured_at: toDatetimeLocalValue(),
      systolic: 0,
      diastolic: 0,
      pulse: "",
    });
  }

  function refreshHome() {
    router.refresh();
  }

  async function handleGlucoseSubmit(values: GlucoseFormValues) {
    const result = await saveGlucoseLogAction(values);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }
    setToast({ message: "Сахар добавлен", variant: "success" });
    closeSheet();
    refreshHome();
  }

  async function handleMealSubmit(values: MealFormValues) {
    const result = await saveMealLogAction(values);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }
    setToast({
      message: "Еда добавлена. Напоминание о сахаре через 1 час.",
      variant: "success",
    });
    closeSheet();
    refreshHome();
  }

  async function handleWeightSubmit(values: WeightFormValues) {
    const parsed = weightFormSchema.safeParse(values);
    if (!parsed.success) {
      setToast({ message: "Проверьте введённые значения", variant: "error" });
      return;
    }

    const result = await saveWeightLogAction(parsed.data);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setToast({ message: "Вес добавлен", variant: "success" });
    closeSheet();
    refreshHome();
  }

  async function handleBloodPressureSubmit(values: BloodPressureFormValues) {
    const parsed = bloodPressureFormSchema.safeParse(values);
    if (!parsed.success) {
      setToast({ message: "Проверьте введённые значения", variant: "error" });
      return;
    }

    const result = await saveBloodPressureLogAction(parsed.data);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setToast({ message: "Давление добавлено", variant: "success" });
    closeSheet();
    refreshHome();
  }

  async function markMedicationTaken(log: MedicationLogWithMedication) {
    setPendingMedId(log.id);
    const result = await updateMedicationLogStatusAction(log.id, "taken", log.scheduled_for);
    setPendingMedId(null);

    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setToast({ message: `${log.medications.name} отмечено`, variant: "success" });
    refreshHome();
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
          onSubmit={handleGlucoseSubmit}
          onCancel={closeSheet}
        />
      </BottomSheet>

      <BottomSheet open={activeSheet === "meal"} title="Добавить еду" onClose={closeSheet}>
        <MealForm onSubmit={handleMealSubmit} onCancel={closeSheet} />
      </BottomSheet>

      <BottomSheet open={activeSheet === "weight"} title="Добавить вес" onClose={closeSheet}>
        <form className="space-y-4" onSubmit={weightForm.handleSubmit(handleWeightSubmit)}>
          <Input label="Дата и время" type="datetime-local" {...weightForm.register("measured_at")} />
          <Input
            label="Вес, кг"
            type="number"
            step="0.1"
            {...weightForm.register("weight", { valueAsNumber: true })}
          />
          <Button type="submit" className="w-full">
            Сохранить
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === "blood_pressure"} title="Отметить давление" onClose={closeSheet}>
        <form className="space-y-4" onSubmit={bpForm.handleSubmit(handleBloodPressureSubmit)}>
          <Input label="Дата и время" type="datetime-local" {...bpForm.register("measured_at")} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Верхнее"
              type="number"
              {...bpForm.register("systolic", { valueAsNumber: true })}
            />
            <Input
              label="Нижнее"
              type="number"
              {...bpForm.register("diastolic", { valueAsNumber: true })}
            />
          </div>
          <Input label="Пульс (необязательно)" type="number" {...bpForm.register("pulse")} />
          <Button type="submit" className="w-full">
            Сохранить
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === "medication"} title="Отметить лекарство" onClose={closeSheet}>
        {pendingMedications.length === 0 ? (
          <p className="text-sm text-muted-foreground">На сегодня все лекарства уже отмечены.</p>
        ) : (
          <div className="space-y-3">
            {pendingMedications.map((log) => (
              <div
                key={log.id}
                className="rounded-(--radius-button) border border-border bg-card p-3"
              >
                <p className="font-medium">{log.medications.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {log.medications.dosage} · {formatDateTime(log.scheduled_for)}
                </p>
                <Button
                  className="mt-3 w-full"
                  disabled={pendingMedId === log.id}
                  onClick={() => void markMedicationTaken(log)}
                >
                  {pendingMedId === log.id ? "Сохраняем..." : "Отметить принятым"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
