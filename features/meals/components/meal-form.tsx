"use client";

import { useForm } from "react-hook-form";
import { mealFormSchema, type MealFormValues } from "@/features/meals/lib/validation";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MealFormProps {
  onSubmit: (values: MealFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MealForm({ onSubmit, onCancel }: MealFormProps) {
  const {
    register,
    handleSubmit,
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
      <Input
        label="Время приёма пищи"
        type="datetime-local"
        error={errors.eaten_at?.message}
        {...register("eaten_at")}
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
