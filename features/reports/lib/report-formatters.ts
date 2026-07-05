import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { parseDateKey } from "@/lib/dates/day";
import type { ReportData } from "@/features/reports/lib/report-types";

export function formatReportPeriodRange(dateFrom: string, dateTo: string) {
  const from = format(parseDateKey(dateFrom.slice(0, 10)), "dd.MM.yy");
  const to = format(parseDateKey(dateTo.slice(0, 10)), "dd.MM.yy");
  return `${from}-${to}`;
}

export function formatReportDayDate(dateKey: string) {
  return format(parseDateKey(dateKey), "d MMM yyyy", { locale: ru });
}

export function formatReportDayDateCompact(dateKey: string) {
  return format(parseDateKey(dateKey), "dd.MM.yy");
}

export function formatReportDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy, HH:mm", { locale: ru });
}

export function formatReportDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: ru });
}

export function formatReportTime(value: string) {
  return format(parseISO(value), "HH:mm", { locale: ru });
}

export function formatBloodPressureValue(systolic: number, diastolic: number) {
  return `${systolic}/${diastolic}`;
}

export function medicationStatusLabel(status: ReportData["medicationRows"][number]["status"]) {
  switch (status) {
    case "taken":
      return "Принято";
    case "skipped":
      return "Пропущено";
    case "pending":
      return "Ожидает";
    case "missing":
      return "Не отмечено";
    default:
      return status;
  }
}
