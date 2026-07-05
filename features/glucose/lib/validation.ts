import { z } from "zod";
import type { GlucoseMeasurementType } from "@/types/database.types";

export function parseMealItems(value: string) {
  const items = value
    .split(/,\s*|\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : [""];
}

export function serializeMealItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).join(", ");
}

export const glucoseFormSchema = z.object({
  value: z
    .number({ error: "Укажите значение" })
    .refine((value) => !Number.isNaN(value), "Укажите значение")
    .min(1, "Укажите значение")
    .max(30, "Слишком большое значение"),
  measured_at: z.string().min(1, "Укажите дату и время"),
  measurement_type: z.enum(["fasting", "after_meal"]),
  meal_text: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.measurement_type === "after_meal" && !serializeMealItems(parseMealItems(data.meal_text ?? ""))) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите, что ели",
      path: ["meal_text"],
    });
  }
});

export type GlucoseFormValues = z.infer<typeof glucoseFormSchema>;

export const MEASUREMENT_TYPE_LABELS: Record<GlucoseMeasurementType, string> = {
  fasting: "Натощак",
  after_meal: "После еды",
};

export const MEASUREMENT_TYPE_FORM_OPTIONS: {
  value: GlucoseFormValues["measurement_type"];
  label: string;
}[] = [
  { value: "fasting", label: "Натощак" },
  { value: "after_meal", label: "После еды" },
];

export function getMeasurementTypeLabel(type: GlucoseMeasurementType) {
  return MEASUREMENT_TYPE_LABELS[type] ?? type;
}

export function normalizeFormMeasurementType(
  type: GlucoseMeasurementType,
): GlucoseFormValues["measurement_type"] {
  return type === "after_meal" ? "after_meal" : "fasting";
}
