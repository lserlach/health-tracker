"use client";

import { useEffect, useRef, useState } from "react";
import {
  combineDatetimeLocalParts,
  formatDatetimeLocalDate,
  formatDatetimeLocalTime,
  getDatetimeLocalDatePart,
  getDatetimeLocalTimePart,
} from "@/lib/dates/format";
import { cn } from "@/lib/utils/cn";

interface DatetimePillPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
}

type EditingField = "date" | "time" | null;

const pillClassName =
  "rounded-full bg-primary-soft/45 px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-soft/65";

const inputClassName =
  "min-h-11 w-full rounded-(--radius-button) border-0 bg-primary-soft/30 px-3 text-base text-field-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm";

export function DatetimePillPicker({
  value,
  onChange,
  onBlur,
  error,
  className,
}: DatetimePillPickerProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField === "date" && dateInputRef.current) {
      dateInputRef.current.focus();
      dateInputRef.current.showPicker?.();
      return;
    }

    if (editingField === "time" && timeInputRef.current) {
      timeInputRef.current.focus();
      timeInputRef.current.showPicker?.();
    }
  }, [editingField]);

  function closeEditor() {
    setEditingField(null);
    onBlur?.();
  }

  function handleDateChange(nextDate: string) {
    onChange(combineDatetimeLocalParts(nextDate, getDatetimeLocalTimePart(value)));
  }

  function handleTimeChange(nextTime: string) {
    onChange(combineDatetimeLocalParts(getDatetimeLocalDatePart(value), nextTime));
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {editingField === "date" ? (
        <input
          ref={dateInputRef}
          type="date"
          value={getDatetimeLocalDatePart(value)}
          onChange={(event) => handleDateChange(event.target.value)}
          onBlur={closeEditor}
          aria-label="Дата"
          className={cn(inputClassName, "w-auto", error && "ring-2 ring-danger/30 focus-visible:ring-danger/30")}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingField("date")}
          className={cn(pillClassName, error && "ring-2 ring-danger/30")}
        >
          {formatDatetimeLocalDate(value)}
        </button>
      )}

      {editingField === "time" ? (
        <input
          ref={timeInputRef}
          type="time"
          value={getDatetimeLocalTimePart(value)}
          onChange={(event) => handleTimeChange(event.target.value)}
          onBlur={closeEditor}
          aria-label="Время"
          className={cn(inputClassName, "w-auto", error && "ring-2 ring-danger/30 focus-visible:ring-danger/30")}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingField("time")}
          className={cn(pillClassName, error && "ring-2 ring-danger/30")}
        >
          {formatDatetimeLocalTime(value)}
        </button>
      )}

      {error ? <span className="w-full text-xs text-danger">{error}</span> : null}
    </div>
  );
}
