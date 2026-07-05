"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { format, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import { formatDateKeyShort } from "@/lib/dates/format";
import { shiftDateKey, toDateKey } from "@/lib/dates/day";

interface DayNavigatorProps {
  dateKey: string;
  onChange: (dateKey: string) => void;
  minDateKey?: string;
  className?: string;
}

function formatDayLabel(dateKey: string) {
  const date = parseISO(dateKey);
  if (isSameDay(date, new Date())) {
    return "Сегодня";
  }
  if (isSameDay(date, new Date(Date.now() - 86400000))) {
    return "Вчера";
  }
  return format(date, "d MMMM yyyy", { locale: ru });
}

export function DayNavigator({ dateKey, onChange, minDateKey, className }: DayNavigatorProps) {
  const todayKey = toDateKey(new Date());
  const canGoNext = dateKey < todayKey;
  const canGoPrev = !minDateKey || dateKey > minDateKey;

  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-2 rounded-(--radius-button) border-0 bg-card px-2 py-2 shadow-none",
        className,
      )}
    >
      <button
        type="button"
        disabled={!canGoPrev}
        onClick={() => onChange(shiftDateKey(dateKey, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-primary/75 transition-colors hover:bg-primary-soft hover:text-primary disabled:text-primary/30 disabled:opacity-100"
        aria-label="Предыдущий день"
      >
        <CaretLeft size={20} weight="bold" />
      </button>

      <div className="min-w-0 text-center">
        <p className="truncate font-heading text-sm font-medium text-foreground">{formatDayLabel(dateKey)}</p>
        <p className="text-xs text-muted-foreground">{formatDateKeyShort(dateKey)}</p>
      </div>

      <button
        type="button"
        disabled={!canGoNext}
        onClick={() => onChange(shiftDateKey(dateKey, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-primary/75 transition-colors hover:bg-primary-soft hover:text-primary disabled:text-primary/30 disabled:opacity-100"
        aria-label="Следующий день"
      >
        <CaretRight size={20} weight="bold" />
      </button>
    </div>
  );
}
