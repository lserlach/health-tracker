"use client";

import { CircleHalf, Drop, Jar, Pill, Syringe, type Icon } from "@phosphor-icons/react";
import {
  MEDICATION_ICON_LABELS,
  MEDICATION_ICON_VALUES,
  type MedicationIconValue,
} from "@/features/medications/lib/medication-icon-values";

export { MEDICATION_ICON_VALUES, type MedicationIconValue } from "@/features/medications/lib/medication-icon-values";

const medicationIconMap: Record<MedicationIconValue, Icon> = {
  pill: Pill,
  capsule: CircleHalf,
  drop: Drop,
  syringe: Syringe,
  jar: Jar,
};

export const MEDICATION_ICON_OPTIONS = MEDICATION_ICON_VALUES.map((value) => ({
  value,
  label: MEDICATION_ICON_LABELS[value],
  icon: medicationIconMap[value],
}));

export function getMedicationIconComponent(icon: string | null | undefined) {
  if (icon && icon in medicationIconMap) {
    return medicationIconMap[icon as MedicationIconValue];
  }

  return Pill;
}
