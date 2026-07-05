"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  getDefaultMealSlot,
  getTakenMealSlotsForMeasuredAt,
} from "@/features/glucose/lib/meal-slots";
import {
  glucoseFormSchema,
  isFastingTakenForMeasuredAt,
  normalizeFormMeasurementType,
  type GlucoseFormValues,
} from "@/features/glucose/lib/validation";
import { MealItemsInput } from "@/features/glucose/components/meal-items-input";
import { MealSlotPicker } from "@/features/glucose/components/meal-slot-picker";
import { MeasurementTypeTabs } from "@/features/glucose/components/measurement-type-tabs";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import type { GlucoseLog, MealLog } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { DatetimeHeaderPicker } from "@/components/ui/datetime-header-picker";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";

interface GlucoseFormProps {
  initialData?: GlucoseLog;
  pendingMeal?: MealLog;
  defaultMeasurementType?: GlucoseFormValues["measurement_type"];
  defaultMeasuredAt?: string;
  dayLogs?: GlucoseLog[];
  onSubmit: (values: GlucoseFormValues) => Promise<{ error?: string } | void>;
  onCancel: () => void;
}

function getDefaultValues(
  initialData?: GlucoseLog,
  pendingMeal?: MealLog,
  defaultMeasurementType?: GlucoseFormValues["measurement_type"],
  defaultMeasuredAt?: string,
  dayLogs?: GlucoseLog[],
): GlucoseFormValues {
  if (initialData) {
    return {
      value: initialData.value,
      measured_at: toDatetimeLocalValue(new Date(initialData.measured_at)),
      measurement_type: normalizeFormMeasurementType(initialData.measurement_type),
      meal_slot: initialData.meal_slot,
      meal_text: initialData.meal_text ?? "",
    };
  }

  const measuredAt = defaultMeasuredAt ?? toDatetimeLocalValue();

  if (pendingMeal) {
    const remindAt = new Date(pendingMeal.remind_at);
    const now = new Date();
    const pendingMeasuredAt = toDatetimeLocalValue(now > remindAt ? now : remindAt);

    return {
      value: Number.NaN,
      measured_at: pendingMeasuredAt,
      measurement_type: "after_meal",
      meal_slot: getDefaultMealSlot(dayLogs ?? [], pendingMeasuredAt),
      meal_text: pendingMeal.meal_text,
    };
  }

  const fastingTaken = isFastingTakenForMeasuredAt(dayLogs ?? [], measuredAt);
  const preferredType = defaultMeasurementType ?? "fasting";
  const measurementType =
    fastingTaken && preferredType === "fasting" ? "after_meal" : preferredType;

  return {
    value: Number.NaN,
    measured_at: measuredAt,
    measurement_type: measurementType,
    meal_slot:
      measurementType === "after_meal"
        ? getDefaultMealSlot(dayLogs ?? [], measuredAt)
        : null,
    meal_text: "",
  };
}

export function GlucoseForm({
  initialData,
  pendingMeal,
  defaultMeasurementType,
  defaultMeasuredAt,
  dayLogs,
  onSubmit,
  onCancel,
}: GlucoseFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GlucoseFormValues>({
    resolver: zodResolver(glucoseFormSchema),
    defaultValues: getDefaultValues(
      initialData,
      pendingMeal,
      defaultMeasurementType,
      defaultMeasuredAt,
      dayLogs,
    ),
  });

  useEffect(() => {
    reset(
      getDefaultValues(
        initialData,
        pendingMeal,
        defaultMeasurementType,
        defaultMeasuredAt,
        dayLogs,
      ),
    );
    setSubmitError(null);
  }, [initialData, pendingMeal, defaultMeasurementType, defaultMeasuredAt, dayLogs, reset]);

  const measurementType = watch("measurement_type");
  const measuredAt = watch("measured_at");
  const mealSlot = watch("meal_slot");
  const fastingDisabled = isFastingTakenForMeasuredAt(dayLogs ?? [], measuredAt, initialData?.id);
  const takenMealSlots = useMemo(
    () => getTakenMealSlotsForMeasuredAt(dayLogs ?? [], measuredAt, initialData?.id),
    [dayLogs, measuredAt, initialData?.id],
  );

  useEffect(() => {
    if (fastingDisabled && measurementType === "fasting") {
      setValue("measurement_type", "after_meal");
    }
  }, [fastingDisabled, measurementType, setValue]);

  useEffect(() => {
    if (measurementType !== "after_meal") {
      setValue("meal_slot", null);
      return;
    }

    if (!mealSlot || takenMealSlots.has(mealSlot)) {
      setValue("meal_slot", getDefaultMealSlot(dayLogs ?? [], measuredAt, initialData?.id));
    }
  }, [measurementType, mealSlot, takenMealSlots, dayLogs, measuredAt, initialData?.id, setValue]);

  async function handleFormSubmit(values: GlucoseFormValues) {
    setSubmitError(null);
    const result = await onSubmit(values);
    if (result?.error) {
      setSubmitError(result.error);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormError message={submitError} />
      <div className="mb-2 pr-12">
        <h2 className="font-heading text-xl font-semibold leading-tight text-foreground">
          {initialData ? "Редактировать" : pendingMeal ? "Измерить сахар" : "Добавить сахар"}
        </h2>
        <Controller
          name="measured_at"
          control={control}
          render={({ field }) => (
            <DatetimeHeaderPicker
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.measured_at?.message}
            />
          )}
        />
      </div>

      {pendingMeal ? null : (
        <Controller
          name="measurement_type"
          control={control}
          render={({ field }) => (
            <MeasurementTypeTabs
              value={field.value}
              onChange={field.onChange}
              error={errors.measurement_type?.message}
              fastingDisabled={fastingDisabled}
            />
          )}
        />
      )}

      {measurementType === "after_meal" ? (
        <Controller
          name="meal_slot"
          control={control}
          render={({ field }) => (
            <MealSlotPicker
              value={field.value}
              onChange={field.onChange}
              disabledSlots={takenMealSlots}
              error={errors.meal_slot?.message}
            />
          )}
        />
      ) : null}

      <Controller
        name="value"
        control={control}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Input
            label="Сахар, ммоль/л"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="5.4"
            error={errors.value?.message}
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

      {measurementType === "after_meal" ? (
        <Controller
          name="meal_text"
          control={control}
          render={({ field }) => (
            <MealItemsInput
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.meal_text?.message}
            />
          )}
        />
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : initialData ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </form>
  );
}
