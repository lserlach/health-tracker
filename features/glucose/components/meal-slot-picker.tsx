"use client";

import { cn } from "@/lib/utils/cn";
import {
  GLUCOSE_MEAL_SLOTS,
  getMealSlotLabel,
} from "@/features/glucose/lib/meal-slots";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";
import type { GlucoseMealSlot } from "@/types/database.types";

type FormMealSlot = NonNullable<GlucoseFormValues["meal_slot"]>;

interface MealSlotPickerProps {
  value: FormMealSlot | null | undefined;
  onChange: (value: FormMealSlot) => void;
  disabledSlots?: Set<GlucoseMealSlot>;
  error?: string;
}

export function MealSlotPicker({
  value,
  onChange,
  disabledSlots,
  error,
}: MealSlotPickerProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <p className="text-sm font-medium text-foreground">Приём пищи</p>
      <div
        className="grid grid-cols-2 gap-1.5 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Приём пищи"
      >
        {GLUCOSE_MEAL_SLOTS.map((slot) => {
          const isActive = value === slot;
          const isDisabled = disabledSlots?.has(slot) ?? false;

          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              title={isDisabled ? "Уже записано за этот день" : undefined}
              className={cn(
                "min-h-11 rounded-(--radius-button) px-3 py-2 text-sm font-medium leading-tight transition-colors",
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/15"
                  : "bg-primary-soft/45 text-muted-foreground hover:text-foreground",
                isDisabled && "cursor-not-allowed opacity-45 hover:text-muted-foreground",
              )}
              onClick={() => {
                if (!isDisabled) {
                  onChange(slot);
                }
              }}
            >
              {getMealSlotLabel(slot)}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
