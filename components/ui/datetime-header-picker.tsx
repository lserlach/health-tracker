"use client";

import { DatetimePillPicker } from "@/components/ui/datetime-pill-picker";

interface DatetimeHeaderPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function DatetimeHeaderPicker(props: DatetimeHeaderPickerProps) {
  return <DatetimePillPicker className="mt-2" {...props} />;
}
