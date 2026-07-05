"use client";

import { formatTime } from "@/lib/dates/format";
import type { MealLog } from "@/types/database.types";
import { Card } from "@/components/ui/card";
import { GlucoseMeasurementBadge } from "@/features/glucose/components/glucose-measurement-badge";
import { MealGlucoseTimerButton } from "@/features/glucose/components/meal-glucose-timer-button";
import { MealItemsDisclosure } from "@/features/glucose/components/meal-items-disclosure";
import { PendingGlucoseBadge } from "@/features/glucose/components/pending-glucose-badge";

interface PendingMealGlucoseCardProps {
  meal: MealLog;
  onMeasure: (meal: MealLog) => void;
}

export function PendingMealGlucoseCard({ meal, onMeasure }: PendingMealGlucoseCardProps) {
  return (
    <Card className="space-y-3 border-0 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <GlucoseMeasurementBadge type="after_meal" />
            <PendingGlucoseBadge />
            <span className="text-xs text-muted-foreground">{formatTime(meal.eaten_at)}</span>
          </div>
        </div>
      </div>

      <p className="font-heading text-2xl font-semibold leading-none text-muted-foreground">
        — <span className="text-sm font-normal">ммоль/л</span>
      </p>

      <MealItemsDisclosure mealText={meal.meal_text} />

      <MealGlucoseTimerButton remindAt={meal.remind_at} onMeasure={() => onMeasure(meal)} />
    </Card>
  );
}
