import { z } from "zod";
import { toDateKey } from "@/lib/dates/day";
import { getDatetimeLocalDatePart } from "@/lib/dates/format";
import type { GlucoseLog, GlucoseMeasurementType } from "@/types/database.types";

export const FASTING_ONCE_PER_DAY_ERROR = "Натощак можно записать только один раз в день";

type FastingLogRef = Pick<GlucoseLog, "id" | "measurement_type" | "measured_at">;

export function findFastingLogForDay(
  logs: FastingLogRef[],
  dateKey: string,
  excludeLogId?: string,
) {
  return (
    logs.find(
      (log) =>
        log.measurement_type === "fasting" &&
        log.id !== excludeLogId &&
        toDateKey(new Date(log.measured_at)) === dateKey,
    ) ?? null
  );
}

export function isFastingTakenForDay(
  logs: FastingLogRef[],
  dateKey: string,
  excludeLogId?: string,
) {
  return findFastingLogForDay(logs, dateKey, excludeLogId) !== null;
}

export function isFastingTakenForMeasuredAt(
  logs: FastingLogRef[],
  measuredAt: string,
  excludeLogId?: string,
) {
  return isFastingTakenForDay(logs, getDatetimeLocalDatePart(measuredAt), excludeLogId);
}

export function parseMealItems(value: string) {
  const items = value
    .split(/,\s*|\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : [""];
}

export function serializeMealItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).join(", ");
}

export const glucoseFormSchema = z.object({
  value: z
    .number({ error: "Укажите значение" })
    .refine((value) => !Number.isNaN(value), "Укажите значение")
    .min(1, "Укажите значение")
    .max(30, "Слишком большое значение"),
  measured_at: z.string().min(1, "Укажите дату и время"),
  measurement_type: z.enum(["fasting", "after_meal"]),
  meal_text: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.measurement_type === "after_meal" && !serializeMealItems(parseMealItems(data.meal_text ?? ""))) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите, что ели",
      path: ["meal_text"],
    });
  }
});

export type GlucoseFormValues = z.infer<typeof glucoseFormSchema>;

export const MEASUREMENT_TYPE_LABELS: Record<GlucoseMeasurementType, string> = {
  fasting: "Натощак",
  after_meal: "После еды",
};

export const MEASUREMENT_TYPE_FORM_OPTIONS: {
  value: GlucoseFormValues["measurement_type"];
  label: string;
}[] = [
  { value: "fasting", label: "Натощак" },
  { value: "after_meal", label: "После еды" },
];

export function getMeasurementTypeLabel(type: GlucoseMeasurementType) {
  return MEASUREMENT_TYPE_LABELS[type] ?? type;
}

export function normalizeFormMeasurementType(
  type: GlucoseMeasurementType,
): GlucoseFormValues["measurement_type"] {
  return type === "after_meal" ? "after_meal" : "fasting";
}
