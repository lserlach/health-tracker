import { toDateKey } from "@/lib/dates/day";
import { getDatetimeLocalDatePart } from "@/lib/dates/format";
import type { GlucoseLog, GlucoseMealSlot } from "@/types/database.types";

export const GLUCOSE_MEAL_SLOTS: GlucoseMealSlot[] = [
  "breakfast",
  "second_breakfast",
  "lunch",
  "afternoon_snack",
  "dinner",
];

/** Meal slots that appear as sugar columns in the doctor report. */
export const GLUCOSE_MEAL_SLOTS_WITH_SUGAR: GlucoseMealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
];

export const MEAL_SLOT_LABELS: Record<GlucoseMealSlot, string> = {
  breakfast: "Завтрак",
  second_breakfast: "2-й завтрак",
  lunch: "Обед",
  afternoon_snack: "Полдник",
  dinner: "Ужин",
};

export const MEAL_SLOT_REPORT_FOOD_LABELS: Record<GlucoseMealSlot, string> = {
  breakfast: "Завтрак",
  second_breakfast: "2-й завтрак",
  lunch: "Обед",
  afternoon_snack: "Полдник",
  dinner: "Ужин",
};

export const GLUCOSE_REPORT_SECTIONS = {
  selfMonitoring: "Самоконтроль",
  nutrition: "Дневник питания",
} as const;

export const MEAL_SLOT_ONCE_PER_DAY_ERROR = "Этот приём пищи уже записан за этот день";

export function getMealSlotLabel(slot: GlucoseMealSlot) {
  return MEAL_SLOT_LABELS[slot];
}

export function getTakenMealSlotsForDay(
  logs: Pick<GlucoseLog, "id" | "measurement_type" | "measured_at" | "meal_slot">[],
  dateKey: string,
  excludeLogId?: string,
) {
  const taken = new Set<GlucoseMealSlot>();

  for (const log of logs) {
    if (
      log.measurement_type !== "after_meal" ||
      !log.meal_slot ||
      log.id === excludeLogId ||
      toDateKey(new Date(log.measured_at)) !== dateKey
    ) {
      continue;
    }

    taken.add(log.meal_slot);
  }

  return taken;
}

export function getTakenMealSlotsForMeasuredAt(
  logs: Pick<GlucoseLog, "id" | "measurement_type" | "measured_at" | "meal_slot">[],
  measuredAt: string,
  excludeLogId?: string,
) {
  return getTakenMealSlotsForDay(logs, getDatetimeLocalDatePart(measuredAt), excludeLogId);
}

export function getDefaultMealSlot(
  logs: Pick<GlucoseLog, "id" | "measurement_type" | "measured_at" | "meal_slot">[],
  measuredAt: string,
  excludeLogId?: string,
): GlucoseMealSlot {
  const taken = getTakenMealSlotsForMeasuredAt(logs, measuredAt, excludeLogId);
  return GLUCOSE_MEAL_SLOTS.find((slot) => !taken.has(slot)) ?? "breakfast";
}
