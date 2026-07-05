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

export function formatDatetimeLocalLabel(value: string) {
  if (!value) return "Укажите дату и время";
  return format(fromDatetimeLocalValue(value), "d MMMM yyyy, HH:mm", { locale: ru });
}

export function formatDatetimeLocalDate(value: string) {
  if (!value) return "Выберите дату";
  return format(fromDatetimeLocalValue(value), "d MMMM yyyy", { locale: ru });
}

export function formatDatetimeLocalTime(value: string) {
  if (!value) return "00:00";
  return format(fromDatetimeLocalValue(value), "HH:mm", { locale: ru });
}

export function getDatetimeLocalDatePart(value: string) {
  if (!value) return format(new Date(), "yyyy-MM-dd");
  return value.slice(0, 10);
}

export function getDatetimeLocalTimePart(value: string) {
  if (!value) return format(new Date(), "HH:mm");
  return value.slice(11, 16) || "00:00";
}

export function combineDatetimeLocalParts(datePart: string, timePart: string) {
  return `${datePart}T${timePart}`;
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMM, HH:mm", { locale: ru });
}

export function formatTime(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "HH:mm", { locale: ru });
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMMM yyyy", { locale: ru });
}

export function formatDateKeyShort(dateKey: string) {
  return format(parseISO(dateKey), "dd.MM.yy");
}

export function formatTodayHeaderDate(date: Date = new Date()) {
  return format(date, "d MMMM", { locale: ru });
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
