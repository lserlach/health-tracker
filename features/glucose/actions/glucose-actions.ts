"use server";

import { revalidatePath } from "next/cache";
import { fromDatetimeLocalValue, getDayRange } from "@/lib/dates/format";
import { parseDateKey, toDateKey } from "@/lib/dates/day";
import { getAuthenticatedUser, ensureUserRecords } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import {
  glucoseFormSchema,
  type GlucoseFormValues,
} from "@/features/glucose/lib/validation";
import type { GlucoseLog } from "@/types/database.types";

function mapForm(values: GlucoseFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    value: values.value,
    measurement_type: values.measurement_type,
    meal_text:
      values.measurement_type === "after_meal" ? values.meal_text?.trim() || null : null,
    minutes_after_meal:
      values.measurement_type === "after_meal" ? values.minutes_after_meal ?? 60 : null,
  };
}

export async function getGlucoseLogsForDayAction(dateKey: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: [] as GlucoseLog[] };

  const { start, end } = getDayRange(parseDateKey(dateKey));

  const { data, error } = await supabase
    .from("glucose_logs")
    .select("*")
    .gte("measured_at", start)
    .lte("measured_at", end)
    .order("measured_at", { ascending: false });

  if (error) return { error: formatSupabaseError(error), data: [] as GlucoseLog[] };
  return { data: (data ?? []) as GlucoseLog[] };
}

export async function getTodayGlucoseLogsAction() {
  return getGlucoseLogsForDayAction(toDateKey());
}

export async function saveGlucoseLogAction(
  values: GlucoseFormValues,
  id?: string,
) {
  const parsed = glucoseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Проверьте введённые значения" };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  await ensureUserRecords(user.id, user.email ?? "");

  const payload = mapForm(parsed.data, user.id);

  const { error } = id
    ? await supabase.from("glucose_logs").update(payload).eq("id", id)
    : await supabase.from("glucose_logs").insert(payload);

  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/glucose");
  revalidatePath("/");
  return { success: true };
}

export async function deleteGlucoseLogAction(id: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  await ensureUserRecords(user.id, user.email ?? "");

  const { error } = await supabase.from("glucose_logs").delete().eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/glucose");
  revalidatePath("/");
  return { success: true };
}
