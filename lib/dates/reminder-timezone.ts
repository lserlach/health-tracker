export const REMINDER_TIMEZONE = process.env.REMINDER_TIMEZONE ?? "Europe/Moscow";
export const REMINDER_TZ_OFFSET = process.env.REMINDER_TZ_OFFSET ?? "+03:00";

export function getReminderDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REMINDER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getReminderClockTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: REMINDER_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function buildReminderDateTime(dateKey: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00.000${REMINDER_TZ_OFFSET}`);
}

export function getReminderDayRange(date: Date = new Date()) {
  const dateKey = getReminderDateKey(date);

  return {
    dateKey,
    start: new Date(`${dateKey}T00:00:00.000${REMINDER_TZ_OFFSET}`).toISOString(),
    end: new Date(`${dateKey}T23:59:59.999${REMINDER_TZ_OFFSET}`).toISOString(),
  };
}

function toReminderDate(value: string | Date) {
  return typeof value === "string" ? new Date(value) : value;
}

export function formatReminderTime(value: string | Date) {
  const date = toReminderDate(value);

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: REMINDER_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatReminderDateTime(value: string | Date) {
  const date = toReminderDate(value);

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: REMINDER_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatReminderDate(value: string | Date) {
  const date = toReminderDate(value);

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: REMINDER_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatReminderShortDate(value: string | Date) {
  const date = toReminderDate(value);

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: REMINDER_TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Reinterpret UTC wall-clock components as reminder-timezone local time. */
export function reinterpretUtcWallClockAsReminderTime(iso: string) {
  const date = new Date(iso);
  const dateKey = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return buildReminderDateTime(dateKey, time).toISOString();
}

export function buildWrongUtcWallClock(dateKey: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00.000Z`).toISOString();
}
