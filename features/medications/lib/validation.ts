import { z } from "zod";
import type { IntakeRelation } from "@/types/database.types";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const medicationFormSchema = z.object({
  name: z.string().trim().min(1, "Укажите название"),
  dosage: z.string().trim().min(1, "Укажите дозировку"),
  icon: z.enum(["pill", "drop", "syringe"]),
  intake_relation: z.enum(["before_food", "after_food", "with_food", "any"]),
  times_per_day: z.number().int().min(1).max(12),
  schedule_times: z.array(z.string().regex(timePattern, "Формат HH:MM")),
  is_active: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.schedule_times.length !== data.times_per_day) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите время для каждого приёма",
      path: ["schedule_times"],
    });
  }
});

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;

export const ICON_OPTIONS = [
  { value: "pill", label: "Таблетка" },
  { value: "drop", label: "Капли" },
  { value: "syringe", label: "Укол" },
] as const;

export const INTAKE_RELATION_OPTIONS: { value: IntakeRelation; label: string }[] = [
  { value: "before_food", label: "До еды" },
  { value: "after_food", label: "После еды" },
  { value: "with_food", label: "Во время еды" },
  { value: "any", label: "Не важно" },
];

export function getIntakeRelationLabel(value: IntakeRelation) {
  return INTAKE_RELATION_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function defaultScheduleTimes(count: number): string[] {
  const presets = ["08:00", "14:00", "20:00", "22:00"];
  return Array.from({ length: count }, (_, index) => presets[index] ?? "12:00");
}
