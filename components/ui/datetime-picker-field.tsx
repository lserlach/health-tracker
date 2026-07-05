"use client";

import { DatetimePillPicker } from "@/components/ui/datetime-pill-picker";

interface DatetimePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function DatetimePickerField({
  label,
  value,
  onChange,
  onBlur,
  error,
}: DatetimePickerFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? <span className="text-sm font-semibold text-muted-foreground">{label}</span> : null}
      <DatetimePillPicker value={value} onChange={onChange} onBlur={onBlur} error={error} />
    </div>
  );
}
