import { addDays, format, isAfter, isBefore, parseISO, startOfDay, subDays } from "date-fns";
import { toDatetimeLocalValue } from "@/lib/dates/format";

export function toDateKey(date: Date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(dateKey: string) {
  return startOfDay(parseISO(dateKey));
}

export function isToday(date: Date) {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

export function clampToToday(date: Date) {
  const today = startOfDay(new Date());
  return isAfter(date, today) ? today : date;
}

export function getDefaultMeasuredAt(selectedDay: Date) {
  if (isToday(selectedDay)) {
    return toDatetimeLocalValue();
  }

  const value = new Date(selectedDay);
  value.setHours(12, 0, 0, 0);
  return toDatetimeLocalValue(value);
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
