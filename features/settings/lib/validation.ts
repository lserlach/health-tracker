import { z } from "zod";
import {
  DEFAULT_NOTIFICATION_TIMES,
  MAX_NOTIFICATION_TIMES,
  NOTIFICATION_REPEAT_MAX,
  NOTIFICATION_REPEAT_MIN,
  normalizeNotificationTimes,
} from "@/features/notifications/lib/notification-schedule";
import { calculateDueDateFromLmp } from "@/lib/pregnancy/calculate";

export const DUPLICATE_NOTIFICATION_TIME_MESSAGE = "Нельзя указывать одно и то же время дважды";

const notificationTimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Укажите время");

const notificationTimesSchema = z
  .array(notificationTimeSchema)
  .min(1, "Добавьте хотя бы одно время")
  .max(MAX_NOTIFICATION_TIMES)
  .superRefine((times, ctx) => {
    const indicesByTime = new Map<string, number[]>();

    times.forEach((time, index) => {
      const indices = indicesByTime.get(time) ?? [];
      indices.push(index);
      indicesByTime.set(time, indices);
    });

    for (const indices of indicesByTime.values()) {
      if (indices.length <= 1) continue;

      for (const index of indices) {
        ctx.addIssue({
          code: "custom",
          message: DUPLICATE_NOTIFICATION_TIME_MESSAGE,
          path: [index],
        });
      }
    }
  });
const repeatCountSchema = z
  .number()
  .min(NOTIFICATION_REPEAT_MIN)
  .max(NOTIFICATION_REPEAT_MAX);

export const settingsFormSchema = z.object({
  display_name: z.string().optional(),
  start_weight: z.string().optional(),
  last_menstrual_date: z.string().min(1, "Укажите дату"),
  tracking_start_date: z.string().min(1, "Укажите дату"),
  glucose_fasting_limit: z.number().min(3).max(15),
  glucose_after_meal_limit: z.number().min(3).max(20),
  notifications_enabled: z.boolean(),
  notify_glucose: z.boolean(),
  notify_medications: z.boolean(),
  notify_weight: z.boolean(),
  notify_blood_pressure: z.boolean(),
  notify_glucose_times: notificationTimesSchema,
  notify_weight_times: notificationTimesSchema,
  notify_blood_pressure_times: notificationTimesSchema,
  notify_medications_repeat_count: repeatCountSchema,
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

function readNotificationTimes(
  times: string[] | null | undefined,
  legacyTime: string | null | undefined,
  fallbackTime: string,
) {
  if (times?.length) {
    return normalizeNotificationTimes(times, fallbackTime);
  }

  return normalizeNotificationTimes(
    legacyTime ? [legacyTime] : null,
    fallbackTime,
  );
}

export function profileToFormValues(
  profile: {
    display_name: string | null;
    start_weight: number | null;
    last_menstrual_date?: string | null;
    tracking_start_date: string | null;
  } | null,
  settings: {
    glucose_fasting_limit: number;
    glucose_after_meal_limit: number;
    notifications_enabled?: boolean;
    notify_glucose?: boolean;
    notify_medications?: boolean;
    notify_weight?: boolean;
    notify_blood_pressure?: boolean;
    notify_glucose_time?: string;
    notify_glucose_times?: string[];
    notify_weight_time?: string;
    notify_weight_times?: string[];
    notify_blood_pressure_time?: string;
    notify_blood_pressure_times?: string[];
    notify_medications_repeat_count?: number;
  } | null,
): SettingsFormValues {
  return {
    display_name: profile?.display_name ?? "",
    start_weight: profile?.start_weight != null ? String(profile.start_weight) : "",
    last_menstrual_date: profile?.last_menstrual_date ?? "2025-12-02",
    tracking_start_date: profile?.tracking_start_date ?? profile?.last_menstrual_date ?? "2025-12-02",
    glucose_fasting_limit: settings?.glucose_fasting_limit ?? 5.1,
    glucose_after_meal_limit: settings?.glucose_after_meal_limit ?? 7.0,
    notifications_enabled: settings?.notifications_enabled ?? false,
    notify_glucose: settings?.notify_glucose ?? false,
    notify_medications: settings?.notify_medications ?? false,
    notify_weight: settings?.notify_weight ?? false,
    notify_blood_pressure: settings?.notify_blood_pressure ?? false,
    notify_glucose_times: readNotificationTimes(
      settings?.notify_glucose_times,
      settings?.notify_glucose_time,
      DEFAULT_NOTIFICATION_TIMES.glucose,
    ),
    notify_weight_times: readNotificationTimes(
      settings?.notify_weight_times,
      settings?.notify_weight_time,
      DEFAULT_NOTIFICATION_TIMES.weight,
    ),
    notify_blood_pressure_times: readNotificationTimes(
      settings?.notify_blood_pressure_times,
      settings?.notify_blood_pressure_time,
      DEFAULT_NOTIFICATION_TIMES.blood_pressure,
    ),
    notify_medications_repeat_count: settings?.notify_medications_repeat_count ?? 1,
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
    due_date: calculateDueDateFromLmp(values.last_menstrual_date),
    tracking_start_date: values.tracking_start_date,
    pregnancy_week: pregnancyWeek,
  };
}

export function formValuesToSettingsUpdate(values: SettingsFormValues) {
  const notificationsEnabled = values.notifications_enabled;
  const glucoseTimes = normalizeNotificationTimes(
    values.notify_glucose_times,
    DEFAULT_NOTIFICATION_TIMES.glucose,
  );
  const weightTimes = normalizeNotificationTimes(
    values.notify_weight_times,
    DEFAULT_NOTIFICATION_TIMES.weight,
  );
  const bloodPressureTimes = normalizeNotificationTimes(
    values.notify_blood_pressure_times,
    DEFAULT_NOTIFICATION_TIMES.blood_pressure,
  );

  return {
    glucose_fasting_limit: values.glucose_fasting_limit,
    glucose_after_meal_limit: values.glucose_after_meal_limit,
    notifications_enabled: notificationsEnabled,
    notify_glucose: notificationsEnabled ? values.notify_glucose : false,
    notify_medications: notificationsEnabled ? values.notify_medications : false,
    notify_weight: notificationsEnabled ? values.notify_weight : false,
    notify_blood_pressure: notificationsEnabled ? values.notify_blood_pressure : false,
    notify_glucose_times: glucoseTimes,
    notify_glucose_time: glucoseTimes[0],
    notify_glucose_repeat_count: 1,
    notify_weight_times: weightTimes,
    notify_weight_time: weightTimes[0],
    notify_weight_repeat_count: 1,
    notify_blood_pressure_times: bloodPressureTimes,
    notify_blood_pressure_time: bloodPressureTimes[0],
    notify_blood_pressure_repeat_count: 1,
    notify_medications_repeat_count: values.notify_medications_repeat_count,
  };
}
