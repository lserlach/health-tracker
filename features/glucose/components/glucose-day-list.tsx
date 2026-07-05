"use client";

import { buildGlucoseDayEntries } from "@/features/glucose/lib/pending-meal-glucose";
import { GlucoseLogCard } from "@/features/glucose/components/glucose-list";
import { PendingMealGlucoseCard } from "@/features/glucose/components/pending-meal-glucose-card";
import type { GlucoseLog, MealLog } from "@/types/database.types";

interface GlucoseDayListProps {
  logs: GlucoseLog[];
  pendingMeals: MealLog[];
  onEdit: (log: GlucoseLog) => void;
  onDelete: (log: GlucoseLog) => void;
  onMeasurePending: (meal: MealLog) => void;
}

export function GlucoseDayList({
  logs,
  pendingMeals,
  onEdit,
  onDelete,
  onMeasurePending,
}: GlucoseDayListProps) {
  const entries = buildGlucoseDayEntries(logs, pendingMeals);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) =>
        entry.kind === "log" && entry.log ? (
          <GlucoseLogCard
            key={entry.log.id}
            log={entry.log}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : entry.kind === "pending_meal" && entry.meal ? (
          <PendingMealGlucoseCard
            key={`pending-${entry.meal.id}`}
            meal={entry.meal}
            onMeasure={onMeasurePending}
          />
        ) : null,
      )}
    </div>
  );
}
