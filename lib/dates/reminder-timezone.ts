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

export function formatReminderTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: REMINDER_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
