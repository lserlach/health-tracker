"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  glucoseFormSchema,
  normalizeFormMeasurementType,
  type GlucoseFormValues,
} from "@/features/glucose/lib/validation";
import { MealItemsInput } from "@/features/glucose/components/meal-items-input";
import { MeasurementTypeTabs } from "@/features/glucose/components/measurement-type-tabs";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import type { GlucoseLog } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { DatetimeHeaderPicker } from "@/components/ui/datetime-header-picker";
import { Input } from "@/components/ui/input";

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
      measurement_type: normalizeFormMeasurementType(initialData.measurement_type),
      meal_text: initialData.meal_text ?? "",
    };
  }

  return {
    value: Number.NaN,
    measured_at: defaultMeasuredAt ?? toDatetimeLocalValue(),
    measurement_type: defaultMeasurementType ?? "fasting",
    meal_text: "",
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
    handleSubmit,
    watch,
    reset,
    control,
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
      <div className="mb-2 pr-12">
        <h2 className="font-heading text-xl font-semibold leading-tight text-foreground">
          {initialData ? "Редактировать" : "Добавить сахар"}
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

      <Controller
        name="measurement_type"
        control={control}
        render={({ field }) => (
          <MeasurementTypeTabs
            value={field.value}
            onChange={field.onChange}
            error={errors.measurement_type?.message}
          />
        )}
      />

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
