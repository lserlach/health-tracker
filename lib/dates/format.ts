import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  buildReminderDateTime,
  formatReminderDate,
  formatReminderDateTime,
  formatReminderShortDate,
  formatReminderTime,
  getReminderClockTime,
  getReminderDateKey,
  getReminderDayRange,
} from "@/lib/dates/reminder-timezone";

export function toDatetimeLocalValue(date: Date = new Date()) {
  return `${getReminderDateKey(date)}T${getReminderClockTime(date)}`;
}

export function fromDatetimeLocalValue(value: string) {
  const [datePart, timePart = "00:00"] = value.split("T");
  if (!datePart) return new Date(value);
  return buildReminderDateTime(datePart, timePart.slice(0, 5));
}

export function formatDatetimeLocalLabel(value: string) {
  if (!value) return "Укажите дату и время";
  return formatReminderDateTime(fromDatetimeLocalValue(value));
}

export function formatDatetimeLocalDate(value: string) {
  if (!value) return "Выберите дату";
  return formatReminderDate(fromDatetimeLocalValue(value));
}

export function formatDatetimeLocalTime(value: string) {
  if (!value) return "00:00";
  return getReminderClockTime(fromDatetimeLocalValue(value));
}

export function getDatetimeLocalDatePart(value: string) {
  if (!value) return getReminderDateKey();
  return value.slice(0, 10);
}

export function getDatetimeLocalTimePart(value: string) {
  if (!value) return getReminderClockTime(new Date());
  return value.slice(11, 16) || "00:00";
}

export function combineDatetimeLocalParts(datePart: string, timePart: string) {
  return `${datePart}T${timePart}`;
}

export function formatDateTime(value: string | Date) {
  return formatReminderDateTime(value);
}

export function formatTime(value: string | Date) {
  return formatReminderTime(value);
}

export function formatDate(value: string | Date) {
  return formatReminderDate(value);
}

export function formatDateKeyShort(dateKey: string) {
  return format(parseISO(dateKey), "dd.MM.yy");
}

export function formatTodayHeaderDate(date: Date = new Date()) {
  return formatReminderShortDate(date);
}

export function getTodayRange() {
  const { start, end } = getReminderDayRange();
  return { start, end };
}

export function getDayRange(date: Date) {
  const { start, end } = getReminderDayRange(date);
  return { start, end };
}
