import { z } from "zod";

export const bloodPressureFormSchema = z.object({
  measured_at: z.string().min(1, "Укажите дату и время"),
  systolic: z.number().min(50).max(300),
  diastolic: z.number().min(30).max(200),
  pulse: z.string().optional(),
});

export type BloodPressureFormValues = z.infer<typeof bloodPressureFormSchema>;

export function isUnusualBloodPressure(systolic: number, diastolic: number) {
  return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
}

export function parsePulse(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
