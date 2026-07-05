export const MEDICATION_COLOR_VALUES = ["purple", "blue", "pink"] as const;

export type MedicationColorValue = (typeof MEDICATION_COLOR_VALUES)[number];

export const MEDICATION_COLOR_OPTIONS: {
  value: MedicationColorValue;
  label: string;
  swatchClass: string;
  iconClass: string;
}[] = [
  {
    value: "purple",
    label: "Фиолетовый",
    swatchClass: "bg-primary",
    iconClass: "bg-primary-soft text-primary",
  },
  {
    value: "blue",
    label: "Синий",
    swatchClass: "bg-[#2f6fe8]",
    iconClass: "bg-fasting-badge-bg text-fasting-badge-fg",
  },
  {
    value: "pink",
    label: "Розовый",
    swatchClass: "bg-danger",
    iconClass: "bg-danger/12 text-danger",
  },
];

export function getMedicationColorValue(color: string | null | undefined): MedicationColorValue {
  if (color && MEDICATION_COLOR_VALUES.includes(color as MedicationColorValue)) {
    return color as MedicationColorValue;
  }

  return "purple";
}

export function getMedicationIconClassName(color: string | null | undefined) {
  return (
    MEDICATION_COLOR_OPTIONS.find((option) => option.value === getMedicationColorValue(color))
      ?.iconClass ?? MEDICATION_COLOR_OPTIONS[0].iconClass
  );
}
