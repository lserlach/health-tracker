"use client";

import {
  Control,
  FieldArrayPath,
  UseFormRegister,
  useFieldArray,
  useFormState,
  useWatch,
} from "react-hook-form";
import { Plus, Trash } from "@phosphor-icons/react";
import type { SettingsFormValues } from "@/features/settings/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NotificationTimesFieldName =
  | "notify_glucose_times"
  | "notify_weight_times"
  | "notify_blood_pressure_times";

interface NotificationTimesEditorProps {
  control: Control<SettingsFormValues>;
  register: UseFormRegister<SettingsFormValues>;
  name: NotificationTimesFieldName;
}

export function NotificationTimesEditor({ control, register, name }: NotificationTimesEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as FieldArrayPath<SettingsFormValues>,
  });
  const times = useWatch({ control, name });
  const { errors } = useFormState({ control, name });
  const fieldErrors = errors[name];

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Input
              type="time"
              label={`Напоминание №${index + 1}`}
              error={
                Array.isArray(fieldErrors)
                  ? fieldErrors[index]?.message
                  : fieldErrors?.message
              }
              {...register(`${name}.${index}`)}
            />
          </div>
          {fields.length > 1 ? (
            <button
              type="button"
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/12"
              aria-label="Удалить время"
              onClick={() => remove(index)}
            >
              <Trash size={18} />
            </button>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="md"
        className="min-h-14 w-full border-dashed bg-white text-sm text-primary hover:bg-primary-soft/40"
        onClick={() => {
          const lastTime = times?.[fields.length - 1];
          append(typeof lastTime === "string" ? lastTime : "12:00");
        }}
      >
        <Plus size={14} weight="bold" aria-hidden />
        Добавить ещё напоминание
      </Button>
    </div>
  );
}
