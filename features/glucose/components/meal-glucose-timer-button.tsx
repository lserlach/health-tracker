"use client";

import { useEffect, useState } from "react";
import { Clock, Drop } from "@phosphor-icons/react";
import { formatCountdown, isMealGlucoseDue } from "@/features/glucose/lib/pending-meal-glucose";
import { Button } from "@/components/ui/button";

interface MealGlucoseTimerButtonProps {
  remindAt: string;
  onMeasure: () => void;
}

export function MealGlucoseTimerButton({ remindAt, onMeasure }: MealGlucoseTimerButtonProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const isReady = isMealGlucoseDue(remindAt, now);

  if (isReady) {
    return (
      <Button type="button" className="w-full text-sm" onClick={onMeasure}>
        <Drop size={15} weight="fill" />
        Измерить сахар
      </Button>
    );
  }

  const remainingMs = new Date(remindAt).getTime() - now;

  return (
    <Button type="button" className="w-full text-sm" variant="secondary" disabled>
      <Clock size={15} weight="fill" />
      Через {formatCountdown(remainingMs)}
    </Button>
  );
}
