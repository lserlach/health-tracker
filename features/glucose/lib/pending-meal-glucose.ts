import type { GlucoseLog, MealLog } from "@/types/database.types";

export interface GlucoseDayEntry {
  kind: "log" | "pending_meal";
  sortAt: string;
  log?: GlucoseLog;
  meal?: MealLog;
}

export function buildGlucoseDayEntries(logs: GlucoseLog[], pendingMeals: MealLog[]): GlucoseDayEntry[] {
  const entries: GlucoseDayEntry[] = [
    ...logs.map((log) => ({
      kind: "log" as const,
      sortAt: log.measured_at,
      log,
    })),
    ...pendingMeals.map((meal) => ({
      kind: "pending_meal" as const,
      sortAt: meal.eaten_at,
      meal,
    })),
  ];

  return entries.sort(
    (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
  );
}

export function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isMealGlucoseDue(remindAt: string, now = Date.now()) {
  return new Date(remindAt).getTime() <= now;
}

export function calcMinutesAfterMeal(eatenAt: string, measuredAt: Date) {
  const diffMinutes = Math.round(
    (measuredAt.getTime() - new Date(eatenAt).getTime()) / (60 * 1000),
  );
  return diffMinutes >= 0 ? diffMinutes : null;
}
