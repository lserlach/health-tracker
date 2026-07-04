import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";

export interface PregnancySummary {
  week: number | null;
  age: PregnancyAge | null;
  ageLabel: string | null;
  progress: PregnancyProgress | null;
  daysUntilDue: number | null;
  dueDateLabel: string | null;
}

export interface PregnancyAge {
  weeks: number;
  days: number;
}

export interface PregnancyProgress {
  totalDays: number;
  progressPercent: number;
  currentTrimester: 1 | 2 | 3;
}

export const PREGNANCY_TOTAL_DAYS = 280;
export const TRIMESTER_DAY_BOUNDS = [0, 91, 189, 280] as const;

function formatCountWord(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatPregnancyAgeLabel(age: PregnancyAge): string {
  const weeksWord = formatCountWord(age.weeks, "неделя", "недели", "недель");
  const daysWord = formatCountWord(age.days, "день", "дня", "дней");

  if (age.days === 0) {
    return `${age.weeks} ${weeksWord}`;
  }

  return `${age.weeks} ${weeksWord}, ${age.days} ${daysWord}`;
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

export function calculatePregnancyAge(
  lastMenstrualDate: string | Date,
  asOf: Date = new Date(),
): PregnancyAge {
  const lmp = typeof lastMenstrualDate === "string" ? parseISO(lastMenstrualDate) : lastMenstrualDate;
  const totalDays = Math.max(0, differenceInCalendarDays(startOfDay(asOf), startOfDay(lmp)));
  const weeks = Math.min(42, Math.floor(totalDays / 7));
  const days = totalDays % 7;

  return { weeks, days };
}

export function calculateDueDateFromLmp(lastMenstrualDate: string | Date): string {
  const lmp = typeof lastMenstrualDate === "string" ? parseISO(lastMenstrualDate) : lastMenstrualDate;
  return format(addDays(startOfDay(lmp), PREGNANCY_TOTAL_DAYS), "yyyy-MM-dd");
}

export function calculateDaysUntilDue(dueDate: string | Date, asOf: Date = new Date()): number {
  const due = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  return differenceInCalendarDays(startOfDay(due), startOfDay(asOf));
}

export function calculatePregnancyProgress(
  lastMenstrualDate: string | Date,
  asOf: Date = new Date(),
): PregnancyProgress {
  const lmp = typeof lastMenstrualDate === "string" ? parseISO(lastMenstrualDate) : lastMenstrualDate;
  const totalDays = Math.min(
    PREGNANCY_TOTAL_DAYS,
    Math.max(0, differenceInCalendarDays(startOfDay(asOf), startOfDay(lmp))),
  );
  const progressPercent = Math.min(100, (totalDays / PREGNANCY_TOTAL_DAYS) * 100);

  let currentTrimester: 1 | 2 | 3 = 1;
  if (totalDays >= TRIMESTER_DAY_BOUNDS[2]) currentTrimester = 3;
  else if (totalDays >= TRIMESTER_DAY_BOUNDS[1]) currentTrimester = 2;

  return { totalDays, progressPercent, currentTrimester };
}

export function getPregnancySummary(
  lastMenstrualDate: string | null | undefined,
  dueDate: string | null | undefined,
  asOf: Date = new Date(),
): PregnancySummary {
  if (!lastMenstrualDate && !dueDate) {
    return {
      week: null,
      age: null,
      ageLabel: null,
      progress: null,
      daysUntilDue: null,
      dueDateLabel: dueDate ?? null,
    };
  }

  const age = lastMenstrualDate ? calculatePregnancyAge(lastMenstrualDate, asOf) : null;
  const progress = lastMenstrualDate ? calculatePregnancyProgress(lastMenstrualDate, asOf) : null;

  const effectiveDueDate =
    dueDate ??
    (lastMenstrualDate ? calculateDueDateFromLmp(lastMenstrualDate) : null);

  return {
    week: lastMenstrualDate ? calculatePregnancyWeek(lastMenstrualDate, asOf) : null,
    age,
    ageLabel: age ? formatPregnancyAgeLabel(age) : null,
    progress,
    daysUntilDue: effectiveDueDate ? calculateDaysUntilDue(effectiveDueDate, asOf) : null,
    dueDateLabel: effectiveDueDate,
  };
}
