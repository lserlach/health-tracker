"use client";

import { Controller, useForm } from "react-hook-form";
import { mealFormSchema, type MealFormValues } from "@/features/meals/lib/validation";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import { Button } from "@/components/ui/button";
import { DatetimePickerField } from "@/components/ui/datetime-picker-field";
import { Input } from "@/components/ui/input";

interface MealFormProps {
  onSubmit: (values: MealFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MealForm({ onSubmit, onCancel }: MealFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MealFormValues>({
    defaultValues: {
      meal_text: "",
      eaten_at: toDatetimeLocalValue(),
    },
  });

  async function handleFormSubmit(values: MealFormValues) {
    const parsed = mealFormSchema.safeParse(values);
    if (!parsed.success) return;
    await onSubmit(parsed.data);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      <Input
        label="Что ели"
        placeholder="Овсянка, яблоко..."
        error={errors.meal_text?.message}
        {...register("meal_text")}
      />
      <Controller
        name="eaten_at"
        control={control}
        render={({ field }) => (
          <DatetimePickerField
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.eaten_at?.message}
          />
        )}
      />
      <p className="text-sm text-muted-foreground">
        Через 1 час придёт напоминание измерить сахар после еды.
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Добавить"}
        </Button>
      </div>
    </form>
  );
}
