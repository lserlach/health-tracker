import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export interface PregnancySummary {
  week: number | null;
  daysUntilDue: number | null;
  dueDateLabel: string | null;
}

export function calculatePregnancyWeek(
  lastMenstrualDate: string | Date,
  asOf: Date = new Date(),
): number {
  const lmp = typeof lastMenstrualDate === "string" ? parseISO(lastMenstrualDate) : lastMenstrualDate;
  const days = differenceInCalendarDays(startOfDay(asOf), startOfDay(lmp));
  const week = Math.floor(days / 7) + 1;
  return Math.max(1, Math.min(42, week));
}

export function calculateDaysUntilDue(dueDate: string | Date, asOf: Date = new Date()): number {
  const due = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  return differenceInCalendarDays(startOfDay(due), startOfDay(asOf));
}

export function getPregnancySummary(
  lastMenstrualDate: string | null | undefined,
  dueDate: string | null | undefined,
  asOf: Date = new Date(),
): PregnancySummary {
  if (!lastMenstrualDate && !dueDate) {
    return { week: null, daysUntilDue: null, dueDateLabel: dueDate ?? null };
  }

  return {
    week: lastMenstrualDate ? calculatePregnancyWeek(lastMenstrualDate, asOf) : null,
    daysUntilDue: dueDate ? calculateDaysUntilDue(dueDate, asOf) : null,
    dueDateLabel: dueDate ?? null,
  };
}
