"use client";

import { ForkKnife, SunHorizon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";

type FormMeasurementType = GlucoseFormValues["measurement_type"];

interface MeasurementTypeTabsProps {
  value: FormMeasurementType;
  onChange: (value: FormMeasurementType) => void;
  error?: string;
  fastingDisabled?: boolean;
}

const tabs: { id: FormMeasurementType; label: string }[] = [
  { id: "fasting", label: "Натощак" },
  { id: "after_meal", label: "После еды" },
];

const iconProps = { size: 18, weight: "fill" as const };

function TabIcon({ type }: { type: FormMeasurementType }) {
  switch (type) {
    case "fasting":
      return <SunHorizon {...iconProps} aria-hidden />;
    case "after_meal":
      return <ForkKnife {...iconProps} aria-hidden />;
  }
}

export function MeasurementTypeTabs({
  value,
  onChange,
  error,
  fastingDisabled = false,
}: MeasurementTypeTabsProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className="grid grid-cols-2 gap-1 rounded-full border-0 bg-primary-soft/45 p-1 shadow-none"
        role="tablist"
        aria-label="Тип измерения"
      >
        {tabs.map((tab) => {
          const isActive = value === tab.id;
          const isDisabled = tab.id === "fasting" && fastingDisabled;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              title={isDisabled ? "Натощак уже записан за этот день" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium leading-tight transition-colors",
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/15"
                  : "bg-transparent text-muted-foreground hover:text-foreground",
                isDisabled && "cursor-not-allowed opacity-45 hover:text-muted-foreground",
              )}
              onClick={() => {
                if (!isDisabled) {
                  onChange(tab.id);
                }
              }}
            >
              <TabIcon type={tab.id} />
              {tab.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
