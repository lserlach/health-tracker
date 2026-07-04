"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  defaultScheduleTimes,
  ICON_OPTIONS,
  INTAKE_RELATION_OPTIONS,
  medicationFormSchema,
  type MedicationFormValues,
} from "@/features/medications/lib/validation";
import type { Medication } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface MedicationFormProps {
  initialData?: Medication;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
  onCancel: () => void;
}

function getDefaultValues(initialData?: Medication): MedicationFormValues {
  if (initialData) {
    const scheduleTimes = (initialData.schedule_times as string[]) ?? defaultScheduleTimes(1);
    return {
      name: initialData.name,
      dosage: initialData.dosage,
      icon: (initialData.icon as MedicationFormValues["icon"]) ?? "pill",
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
    intake_relation: "any",
    times_per_day: 1,
    schedule_times: defaultScheduleTimes(1),
    is_active: true,
  };
}

export function MedicationForm({ initialData, onSubmit, onCancel }: MedicationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    defaultValues: getDefaultValues(initialData),
  });

  const timesPerDay = watch("times_per_day");
  const prevTimesPerDay = useRef(timesPerDay);

  useEffect(() => {
    reset(getDefaultValues(initialData));
    prevTimesPerDay.current = initialData?.times_per_day ?? 1;
  }, [initialData, reset]);

  useEffect(() => {
    if (prevTimesPerDay.current === timesPerDay) return;
    setValue("schedule_times", defaultScheduleTimes(timesPerDay));
    prevTimesPerDay.current = timesPerDay;
  }, [timesPerDay, setValue]);

  async function handleFormSubmit(values: MedicationFormValues) {
    const parsed = medicationFormSchema.safeParse(values);
    if (!parsed.success) return;
    await onSubmit(parsed.data);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
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

      <Select
        label="Иконка"
        options={ICON_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
        error={errors.icon?.message}
        {...register("icon")}
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
        <p className="text-sm font-medium text-foreground">Время приёма</p>
        {Array.from({ length: timesPerDay }, (_, index) => (
          <Input
            key={`schedule-${index}`}
            label={`Приём ${index + 1}`}
            type="time"
            error={errors.schedule_times?.[index]?.message}
            {...register(`schedule_times.${index}` as const)}
          />
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("is_active")} />
        Активно в расписании
      </label>

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
