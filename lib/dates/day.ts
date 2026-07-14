import { addDays, isBefore, parseISO, startOfDay, subDays } from "date-fns";
import { toDatetimeLocalValue } from "@/lib/dates/format";
import { getReminderDateKey } from "@/lib/dates/reminder-timezone";

export function toDateKey(date: Date = new Date()) {
  return getReminderDateKey(date);
}

export function parseDateKey(dateKey: string) {
  return startOfDay(parseISO(dateKey));
}

export function isToday(date: Date) {
  return getReminderDateKey(date) === getReminderDateKey(new Date());
}

export function clampToToday(date: Date) {
  const todayKey = getReminderDateKey();
  const dateKey = getReminderDateKey(date);
  return dateKey > todayKey ? parseDateKey(todayKey) : date;
}

export function getDefaultMeasuredAt(selectedDay: Date) {
  if (isToday(selectedDay)) {
    return toDatetimeLocalValue();
  }

  const dateKey = getReminderDateKey(selectedDay);
  return `${dateKey}T12:00`;
}

export function getEarliestNavigationDate(options: {
  lastMenstrualDate?: string | null;
  trackingStartDate?: string | null;
}) {
  const candidates = [subDays(new Date(), 120)];

  if (options.lastMenstrualDate) {
    candidates.push(parseISO(options.lastMenstrualDate));
  }

  if (options.trackingStartDate) {
    candidates.push(parseISO(options.trackingStartDate));
  }

  return candidates.reduce((earliest, date) =>
    isBefore(date, earliest) ? date : earliest,
  );
}

export function shiftDateKey(dateKey: string, delta: number) {
  return toDateKey(addDays(parseDateKey(dateKey), delta));
}
