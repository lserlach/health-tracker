import { z } from "zod";
import type { GlucoseMeasurementType } from "@/types/database.types";

export const glucoseFormSchema = z.object({
  value: z.number().min(1, "Укажите значение").max(30, "Слишком большое значение"),
  measured_at: z.string().min(1, "Укажите дату и время"),
  measurement_type: z.enum(["fasting", "after_meal", "bedtime", "other"]),
  meal_text: z.string().optional(),
  minutes_after_meal: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.measurement_type === "after_meal" && !data.meal_text?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите, что ели",
      path: ["meal_text"],
    });
  }
});

export type GlucoseFormValues = z.infer<typeof glucoseFormSchema>;

export const MEASUREMENT_TYPE_OPTIONS: {
  value: GlucoseMeasurementType;
  label: string;
}[] = [
  { value: "fasting", label: "Натощак" },
  { value: "after_meal", label: "После еды" },
  { value: "bedtime", label: "Перед сном" },
  { value: "other", label: "Другое" },
];

export function getMeasurementTypeLabel(type: GlucoseMeasurementType) {
  return MEASUREMENT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}
