export const MEDICATION_ICON_VALUES = ["pill", "capsule", "drop", "syringe", "jar"] as const;

export type MedicationIconValue = (typeof MEDICATION_ICON_VALUES)[number];

export const MEDICATION_ICON_LABELS: Record<MedicationIconValue, string> = {
  pill: "Таблетка",
  capsule: "Капсула",
  drop: "Капли",
  syringe: "Укол",
  jar: "Мазь",
};
