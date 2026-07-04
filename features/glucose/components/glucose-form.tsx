"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  glucoseFormSchema,
  MEASUREMENT_TYPE_OPTIONS,
  type GlucoseFormValues,
} from "@/features/glucose/lib/validation";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import type { GlucoseLog } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface GlucoseFormProps {
  initialData?: GlucoseLog;
  defaultMeasurementType?: GlucoseFormValues["measurement_type"];
  defaultMeasuredAt?: string;
  onSubmit: (values: GlucoseFormValues) => Promise<void>;
  onCancel: () => void;
}

function getDefaultValues(
  initialData?: GlucoseLog,
  defaultMeasurementType?: GlucoseFormValues["measurement_type"],
  defaultMeasuredAt?: string,
): GlucoseFormValues {
  if (initialData) {
    return {
      value: initialData.value,
      measured_at: toDatetimeLocalValue(new Date(initialData.measured_at)),
      measurement_type: initialData.measurement_type,
      meal_text: initialData.meal_text ?? "",
      minutes_after_meal: initialData.minutes_after_meal ?? 60,
    };
  }

  return {
    value: 0,
    measured_at: defaultMeasuredAt ?? toDatetimeLocalValue(),
    measurement_type: defaultMeasurementType ?? "fasting",
    meal_text: "",
    minutes_after_meal: 60,
  };
}

export function GlucoseForm({
  initialData,
  defaultMeasurementType,
  defaultMeasuredAt,
  onSubmit,
  onCancel,
}: GlucoseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GlucoseFormValues>({
    defaultValues: getDefaultValues(initialData, defaultMeasurementType, defaultMeasuredAt),
  });

  useEffect(() => {
    reset(getDefaultValues(initialData, defaultMeasurementType, defaultMeasuredAt));
  }, [initialData, defaultMeasurementType, defaultMeasuredAt, reset]);

  const measurementType = watch("measurement_type");

  async function handleFormSubmit(values: GlucoseFormValues) {
    const parsed = glucoseFormSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }
    await onSubmit(parsed.data);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      <Input
        label="Сахар, ммоль/л"
        type="number"
        step="0.1"
        inputMode="decimal"
        placeholder="5.4"
        error={errors.value?.message}
        {...register("value", { valueAsNumber: true })}
      />

      <Input
        label="Дата и время"
        type="datetime-local"
        error={errors.measured_at?.message}
        {...register("measured_at")}
      />

      <Select
        label="Тип измерения"
        options={MEASUREMENT_TYPE_OPTIONS}
        error={errors.measurement_type?.message}
        {...register("measurement_type")}
      />

      {measurementType === "after_meal" ? (
        <>
          <Input
            label="Что ели"
            placeholder="Овсянка, яблоко..."
            error={errors.meal_text?.message}
            {...register("meal_text")}
          />
          <Input
            label="Через сколько минут после еды"
            type="number"
            inputMode="numeric"
            error={errors.minutes_after_meal?.message}
            {...register("minutes_after_meal", { valueAsNumber: true })}
          />
        </>
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
