"use client";

import { cn } from "@/lib/utils/cn";
import {
  MEDICATION_COLOR_OPTIONS,
  type MedicationColorValue,
} from "@/features/medications/lib/medication-colors";
import {
  MEDICATION_ICON_OPTIONS,
  type MedicationIconValue,
} from "@/features/medications/lib/medication-icons";

interface MedicationIconPickerProps {
  icon: MedicationIconValue;
  color: MedicationColorValue;
  onIconChange: (value: MedicationIconValue) => void;
  onColorChange: (value: MedicationColorValue) => void;
  iconError?: string;
  colorError?: string;
}

export function MedicationIconPicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  iconError,
  colorError,
}: MedicationIconPickerProps) {
  const activeColor = MEDICATION_COLOR_OPTIONS.find((option) => option.value === color);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3">
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted-foreground">Иконка</span>
        <div
          className="grid min-w-0 grid-cols-5 gap-1.5"
          role="radiogroup"
          aria-label="Иконка лекарства"
        >
          {MEDICATION_ICON_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = icon === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={option.label}
                className={cn(
                  "flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-(--radius-button) px-0.5 py-2 transition-colors",
                  isActive
                    ? cn(activeColor?.iconClass, "shadow-sm ring-2 ring-current/20")
                    : "bg-primary-soft/45 text-muted-foreground hover:bg-primary-soft/70 hover:text-foreground",
                )}
                onClick={() => onIconChange(option.value)}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden />
                <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        {iconError ? <p className="text-sm text-danger">{iconError}</p> : null}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted-foreground">Цвет</span>
        <div
          className="flex min-w-0 flex-wrap items-center gap-2"
          role="radiogroup"
          aria-label="Цвет иконки лекарства"
        >
          {MEDICATION_COLOR_OPTIONS.map((option) => {
            const isActive = color === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={option.label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-transform",
                  option.swatchClass,
                  isActive ? "ring-2 ring-foreground/20 ring-offset-2 ring-offset-card" : "opacity-80",
                )}
                onClick={() => onColorChange(option.value)}
              />
            );
          })}
        </div>
        {colorError ? <p className="text-sm text-danger">{colorError}</p> : null}
      </div>
    </div>
  );
}
