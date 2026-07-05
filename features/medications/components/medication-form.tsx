"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  defaultScheduleTimes,
  INTAKE_RELATION_OPTIONS,
  medicationFormSchema,
  type MedicationFormValues,
} from "@/features/medications/lib/validation";
import { MedicationIconPicker } from "@/features/medications/components/medication-icon-picker";
import { getMedicationColorValue } from "@/features/medications/lib/medication-colors";
import type { MedicationIconValue } from "@/features/medications/lib/medication-icon-values";
import type { Medication } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface MedicationFormProps {
  initialData?: Medication;
  onSubmit: (values: MedicationFormValues) => Promise<{ error?: string } | void>;
  onCancel: () => void;
}

function getDefaultValues(initialData?: Medication): MedicationFormValues {
  if (initialData) {
    const scheduleTimes = (initialData.schedule_times as string[]) ?? defaultScheduleTimes(1);
    return {
      name: initialData.name,
      dosage: initialData.dosage,
      icon: (initialData.icon as MedicationIconValue) ?? "pill",
      icon_color: getMedicationColorValue(initialData.icon_color),
      intake_relation: initialData.intake_relation,
      times_per_day: initialData.times_per_day,
      schedule_times: scheduleTimes,
      is_active: initialData.is_active,
    };
  }

  return {
    name: "",
    dosage: "",
    icon: "pill",
    icon_color: "purple",
    intake_relation: "any",
    times_per_day: 1,
    schedule_times: defaultScheduleTimes(1),
    is_active: true,
  };
}

export function MedicationForm({ initialData, onSubmit, onCancel }: MedicationFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: getDefaultValues(initialData),
  });

  const timesPerDay = watch("times_per_day");
  const prevTimesPerDay = useRef(timesPerDay);

  useEffect(() => {
    reset(getDefaultValues(initialData));
    prevTimesPerDay.current = initialData?.times_per_day ?? 1;
    setSubmitError(null);
  }, [initialData, reset]);

  useEffect(() => {
    if (prevTimesPerDay.current === timesPerDay) return;
    setValue("schedule_times", defaultScheduleTimes(timesPerDay));
    prevTimesPerDay.current = timesPerDay;
  }, [timesPerDay, setValue]);

  async function handleFormSubmit(values: MedicationFormValues) {
    setSubmitError(null);
    const result = await onSubmit(values);
    if (result?.error) {
      setSubmitError(result.error);
    }
  }

  return (
    <form className="min-w-0 max-w-full space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormError message={submitError} />
      <Input
        label="Название"
        placeholder="Магний B6"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Дозировка"
        placeholder="500 мг"
        error={errors.dosage?.message}
        {...register("dosage")}
      />

      <Controller
        name="icon"
        control={control}
        render={({ field: iconField }) => (
          <Controller
            name="icon_color"
            control={control}
            render={({ field: colorField }) => (
              <MedicationIconPicker
                icon={iconField.value}
                color={colorField.value}
                onIconChange={iconField.onChange}
                onColorChange={colorField.onChange}
                iconError={errors.icon?.message}
                colorError={errors.icon_color?.message}
              />
            )}
          />
        )}
      />

      <Select
        label="Когда принимать"
        options={INTAKE_RELATION_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
        error={errors.intake_relation?.message}
        {...register("intake_relation")}
      />

      <Input
        label="Приёмов в день"
        type="number"
        min={1}
        max={12}
        error={errors.times_per_day?.message}
        {...register("times_per_day", { valueAsNumber: true })}
      />

      <div className="space-y-3">
        {Array.from({ length: timesPerDay }, (_, index) => (
          <Input
            key={`schedule-${index}`}
            label={`Время приёма ${index + 1}`}
            type="time"
            className="min-w-0 max-w-full"
            error={errors.schedule_times?.[index]?.message}
            {...register(`schedule_times.${index}` as const)}
          />
        ))}
      </div>

      <Controller
        name="is_active"
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            label="Активно в расписании"
            className="items-center"
          />
        )}
      />

      <div className="flex min-w-0 gap-3 pt-2">
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
