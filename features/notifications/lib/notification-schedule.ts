export const NOTIFICATION_REPEAT_MIN = 1;
export const NOTIFICATION_REPEAT_MAX = 5;
export const NOTIFICATION_CRON_INTERVAL_MINUTES = 15;
export const NOTIFICATION_REPEAT_INTERVAL_MINUTES = NOTIFICATION_CRON_INTERVAL_MINUTES;
export const MAX_NOTIFICATION_TIMES = 10;

export const DEFAULT_NOTIFICATION_TIMES = {
  glucose: "08:00",
  weight: "09:00",
  blood_pressure: "10:00",
} as const;

export const notificationRepeatOptions = Array.from(
  { length: NOTIFICATION_REPEAT_MAX - NOTIFICATION_REPEAT_MIN + 1 },
  (_, index) => {
    const value = String(NOTIFICATION_REPEAT_MIN + index);
    return { value, label: value };
  },
);

export function parseNotificationTime(value: string | null | undefined) {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  if (!match) {
    return { hour: 8, minute: 0 };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

export function clampRepeatCount(value: number | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NOTIFICATION_REPEAT_MIN;
  return Math.min(NOTIFICATION_REPEAT_MAX, Math.max(NOTIFICATION_REPEAT_MIN, Math.round(parsed)));
}

export function normalizeNotificationTimes(
  times: string[] | null | undefined,
  fallbackTime: string,
) {
  const normalized = (times ?? [])
    .map((value) => value.trim())
    .filter((value) => /^\d{2}:\d{2}$/.test(value));

  if (normalized.length === 0) {
    return [fallbackTime];
  }

  return [...new Set(normalized)].slice(0, MAX_NOTIFICATION_TIMES);
}

export function isExactReminderWindowActive(
  localHour: number,
  localMinute: number,
  targetHour: number,
  targetMinute: number,
  windowMinutes = NOTIFICATION_CRON_INTERVAL_MINUTES,
) {
  const now = localHour * 60 + localMinute;
  const target = targetHour * 60 + targetMinute;
  return now >= target && now < target + windowMinutes;
}

/** @deprecated Use isExactReminderWindowActive for daily reminders. */
export function isReminderSlotActive(
  localHour: number,
  localMinute: number,
  targetHour: number,
  targetMinute: number,
  slotIndex: number,
) {
  const now = localHour * 60 + localMinute;
  const slotStart =
    targetHour * 60 + targetMinute + slotIndex * NOTIFICATION_CRON_INTERVAL_MINUTES;
  return now >= slotStart && now < slotStart + NOTIFICATION_CRON_INTERVAL_MINUTES;
}

export function buildDailyReminderKey(type: string, dateKey: string, time: string) {
  return `${type}:${dateKey}:${time}`;
}

export function buildMedicationReminderKey(logId: string, slotIndex: number) {
  return `medication:${logId}:${slotIndex}`;
}

export function addMinutesToTime(hour: number, minute: number, minutesToAdd: number) {
  const totalMinutes = hour * 60 + minute + minutesToAdd;
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}
