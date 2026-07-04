import {
  DEFAULT_NOTIFICATION_TIMES,
  normalizeNotificationTimes,
  parseNotificationTime,
} from "@/features/notifications/lib/notification-schedule";
import type { Settings } from "@/types/database.types";

const TIMEZONE = process.env.REMINDER_TIMEZONE ?? "Europe/Moscow";
const TZ_OFFSET = process.env.REMINDER_TZ_OFFSET ?? "+03:00";

export interface TodayNotificationItem {
  id: string;
  scheduledAt: string;
  timeLabel: string;
  title: string;
  href: string;
}

interface PendingMedicationLog {
  id: string;
  scheduled_for: string;
  status: string;
  medications: { name: string } | null;
}

interface BuildTodayNotificationQueueInput {
  settings: Settings | null;
  medicationLogs: PendingMedicationLog[];
  mealLogs: Pick<
    import("@/types/database.types").MealLog,
    "id" | "meal_text" | "remind_at" | "reminder_sent"
  >[];
  now?: Date;
}

function getLocalDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildScheduledTime(dateKey: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00.000${TZ_OFFSET}`);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function appendDailyReminderItems(
  items: TodayNotificationItem[],
  input: {
    id: string;
    enabled: boolean;
    times: string[] | null | undefined;
    legacyTime: string | null | undefined;
    fallbackTime: string;
    title: string;
    href: string;
    dateKey: string;
    now: Date;
  },
) {
  if (!input.enabled) return;

  const times = normalizeNotificationTimes(
    input.times ?? (input.legacyTime ? [input.legacyTime] : null),
    input.fallbackTime,
  );

  for (const time of times) {
    const { hour, minute } = parseNotificationTime(time);
    const scheduledAt = buildScheduledTime(input.dateKey, hour, minute);
    if (scheduledAt.getTime() <= input.now.getTime()) continue;

    items.push({
      id: `${input.id}-${time}`,
      scheduledAt: scheduledAt.toISOString(),
      timeLabel: formatTimeLabel(scheduledAt),
      title: input.title,
      href: input.href,
    });
  }
}

export function buildTodayNotificationQueue({
  settings,
  medicationLogs,
  mealLogs,
  now = new Date(),
}: BuildTodayNotificationQueueInput): TodayNotificationItem[] {
  const dateKey = getLocalDateKey(now);
  const items: TodayNotificationItem[] = [];

  for (const meal of mealLogs) {
    if (meal.reminder_sent) continue;
    const scheduledAt = new Date(meal.remind_at);
    if (scheduledAt.getTime() <= now.getTime()) continue;

    items.push({
      id: `meal-${meal.id}`,
      scheduledAt: meal.remind_at,
      timeLabel: formatTimeLabel(scheduledAt),
      title: `Измерить сахар после еды: ${meal.meal_text}`,
      href: "/",
    });
  }

  if (!settings?.notifications_enabled) {
    return items.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }

  appendDailyReminderItems(items, {
    id: "glucose",
    enabled: settings.notify_glucose,
    times: settings.notify_glucose_times,
    legacyTime: settings.notify_glucose_time,
    fallbackTime: DEFAULT_NOTIFICATION_TIMES.glucose,
    title: "Отметить сахар",
    href: "/",
    dateKey,
    now,
  });

  appendDailyReminderItems(items, {
    id: "weight",
    enabled: settings.notify_weight,
    times: settings.notify_weight_times,
    legacyTime: settings.notify_weight_time,
    fallbackTime: DEFAULT_NOTIFICATION_TIMES.weight,
    title: "Отметить вес",
    href: "/",
    dateKey,
    now,
  });

  appendDailyReminderItems(items, {
    id: "blood_pressure",
    enabled: settings.notify_blood_pressure,
    times: settings.notify_blood_pressure_times,
    legacyTime: settings.notify_blood_pressure_time,
    fallbackTime: DEFAULT_NOTIFICATION_TIMES.blood_pressure,
    title: "Отметить давление",
    href: "/",
    dateKey,
    now,
  });

  if (settings.notify_medications) {
    for (const log of medicationLogs) {
      if (log.status !== "pending") continue;

      const scheduledAt = new Date(log.scheduled_for);
      if (scheduledAt.getTime() <= now.getTime()) continue;

      const medicationName = log.medications?.name ?? "лекарство";
      items.push({
        id: `medication-${log.id}`,
        scheduledAt: log.scheduled_for,
        timeLabel: formatTimeLabel(scheduledAt),
        title: `Отметить лекарство: ${medicationName}`,
        href: "/",
      });
    }
  }

  return items.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
}

export function areNotificationsConfigured(settings: Settings | null) {
  if (!settings?.notifications_enabled) return false;

  return (
    settings.notify_glucose ||
    settings.notify_medications ||
    settings.notify_weight ||
    settings.notify_blood_pressure
  );
}
