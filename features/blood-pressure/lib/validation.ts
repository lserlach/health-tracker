import { z } from "zod";

export const bloodPressureFormSchema = z.object({
  measured_at: z.string().min(1, "Укажите дату и время"),
  systolic: z
    .number({ error: "Укажите верхнее" })
    .refine((value) => !Number.isNaN(value), "Укажите верхнее")
    .min(50, "Укажите верхнее")
    .max(300, "Слишком большое значение"),
  diastolic: z
    .number({ error: "Укажите нижнее" })
    .refine((value) => !Number.isNaN(value), "Укажите нижнее")
    .min(30, "Укажите нижнее")
    .max(200, "Слишком большое значение"),
  pulse: z.string().optional(),
});

export type BloodPressureFormValues = z.infer<typeof bloodPressureFormSchema>;

export function isUnusualBloodPressure(systolic: number, diastolic: number) {
  return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
}

export function isElevatedBloodPressure(systolic: number, diastolic: number) {
  return systolic > 140 || diastolic > 90;
}

export function parsePulse(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
