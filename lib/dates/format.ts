import {
  endOfDay,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";

export function toDatetimeLocalValue(date: Date = new Date()) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function fromDatetimeLocalValue(value: string) {
  return new Date(value);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMM, HH:mm", { locale: ru });
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMMM yyyy", { locale: ru });
}

export function getTodayRange() {
  const now = new Date();
  return {
    start: startOfDay(now).toISOString(),
    end: endOfDay(now).toISOString(),
  };
}

export function getDayRange(date: Date) {
  return {
    start: startOfDay(date).toISOString(),
    end: endOfDay(date).toISOString(),
  };
}
