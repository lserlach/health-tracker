import { z } from "zod";

export const settingsFormSchema = z.object({
  display_name: z.string().optional(),
  start_weight: z.string().optional(),
  last_menstrual_date: z.string().min(1, "Укажите дату"),
  due_date: z.string().min(1, "Укажите ПДР"),
  tracking_start_date: z.string().min(1, "Укажите дату"),
  glucose_fasting_limit: z.number().min(3).max(15),
  glucose_after_meal_limit: z.number().min(3).max(20),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function profileToFormValues(
  profile: {
    display_name: string | null;
    start_weight: number | null;
    last_menstrual_date?: string | null;
    due_date?: string | null;
    tracking_start_date: string | null;
  } | null,
  settings: {
    glucose_fasting_limit: number;
    glucose_after_meal_limit: number;
  } | null,
): SettingsFormValues {
  return {
    display_name: profile?.display_name ?? "",
    start_weight: profile?.start_weight != null ? String(profile.start_weight) : "",
    last_menstrual_date: profile?.last_menstrual_date ?? "2025-12-02",
    due_date: profile?.due_date ?? "2026-09-08",
    tracking_start_date: profile?.tracking_start_date ?? profile?.last_menstrual_date ?? "2025-12-02",
    glucose_fasting_limit: settings?.glucose_fasting_limit ?? 5.1,
    glucose_after_meal_limit: settings?.glucose_after_meal_limit ?? 7.0,
  };
}

function parseOptionalWeight(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formValuesToProfileUpdate(values: SettingsFormValues, pregnancyWeek: number) {
  return {
    display_name: values.display_name?.trim() || null,
    start_weight: parseOptionalWeight(values.start_weight),
    last_menstrual_date: values.last_menstrual_date,
    due_date: values.due_date,
    tracking_start_date: values.tracking_start_date,
    pregnancy_week: pregnancyWeek,
  };
}

export function formValuesToSettingsUpdate(values: SettingsFormValues) {
  return {
    glucose_fasting_limit: values.glucose_fasting_limit,
    glucose_after_meal_limit: values.glucose_after_meal_limit,
  };
}
