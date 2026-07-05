import { toDateKey } from "@/lib/dates/day";
import {
  GLUCOSE_MEAL_SLOTS,
  GLUCOSE_MEAL_SLOTS_WITH_SUGAR,
  MEAL_SLOT_REPORT_FOOD_LABELS,
} from "@/features/glucose/lib/meal-slots";
import type { GlucoseLog, GlucoseMealSlot } from "@/types/database.types";

export interface GlucoseReportDayRow {
  dateKey: string;
  fasting: GlucoseLog | null;
  mealSugar: Record<GlucoseMealSlot, GlucoseLog | null>;
  mealFood: Record<GlucoseMealSlot, string | null>;
}

export type GlucoseReportSugarColumnKey = "fasting" | (typeof GLUCOSE_MEAL_SLOTS_WITH_SUGAR)[number];

export const GLUCOSE_REPORT_SUGAR_HEADERS: Array<{ key: GlucoseReportSugarColumnKey; label: string }> =
  [
    { key: "fasting", label: "Натощак" },
    { key: "breakfast", label: "1 ч после завтрака" },
    { key: "lunch", label: "1 ч после обеда" },
    { key: "dinner", label: "1 ч после ужина" },
  ];

export const GLUCOSE_REPORT_FOOD_HEADERS = GLUCOSE_MEAL_SLOTS.map((slot) => ({
  key: slot,
  label: MEAL_SLOT_REPORT_FOOD_LABELS[slot],
}));

function createEmptyMealRecord<T>(value: T) {
  return GLUCOSE_MEAL_SLOTS.reduce(
    (record, slot) => {
      record[slot] = value;
      return record;
    },
    {} as Record<GlucoseMealSlot, T>,
  );
}

export function groupGlucoseLogsByDay(logs: GlucoseLog[]): GlucoseReportDayRow[] {
  const byDay = new Map<string, GlucoseLog[]>();

  for (const log of logs) {
    const dateKey = toDateKey(new Date(log.measured_at));
    const dayLogs = byDay.get(dateKey) ?? [];
    dayLogs.push(log);
    byDay.set(dateKey, dayLogs);
  }

  return Array.from(byDay.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, dayLogs]) => {
      const mealSugar = createEmptyMealRecord<GlucoseLog | null>(null);
      const mealFood = createEmptyMealRecord<string | null>(null);
      let fasting: GlucoseLog | null = null;

      for (const log of dayLogs) {
        if (log.measurement_type === "fasting") {
          fasting = log;
          continue;
        }

        if (log.measurement_type !== "after_meal" || !log.meal_slot) {
          continue;
        }

        mealSugar[log.meal_slot] = log;
        mealFood[log.meal_slot] = log.meal_text?.trim() || null;
      }

      return {
        dateKey,
        fasting,
        mealSugar,
        mealFood,
      };
    });
}

export function getGlucoseReportSugarLog(
  row: GlucoseReportDayRow,
  key: GlucoseReportSugarColumnKey,
) {
  return key === "fasting" ? row.fasting : row.mealSugar[key];
}

export function formatGlucoseReportValue(value: number) {
  return value.toFixed(1);
}

export function formatGlucoseReportSugarCell(log: GlucoseLog | null) {
  return log ? formatGlucoseReportValue(Number(log.value)) : "—";
}

export function formatGlucoseReportFoodCell(value: string | null) {
  return value?.trim() || "—";
}
