"use server";

import { revalidatePath } from "next/cache";
import { fromDatetimeLocalValue, getDayRange } from "@/lib/dates/format";
import { parseDateKey, toDateKey } from "@/lib/dates/day";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import {
  bloodPressureFormSchema,
  parsePulse,
  type BloodPressureFormValues,
} from "@/features/blood-pressure/lib/validation";
import type { BloodPressureLog } from "@/types/database.types";

function mapForm(values: BloodPressureFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    systolic: values.systolic,
    diastolic: values.diastolic,
    pulse: parsePulse(values.pulse),
  };
}

export async function getBloodPressureLogsForDayAction(dateKey: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: [] as BloodPressureLog[] };

  const { start, end } = getDayRange(parseDateKey(dateKey));

  const { data, error } = await supabase
    .from("blood_pressure_logs")
    .select("*")
    .gte("measured_at", start)
    .lte("measured_at", end)
    .order("measured_at", { ascending: false });

  if (error) return { error: formatSupabaseError(error), data: [] as BloodPressureLog[] };
  return { data: (data ?? []) as BloodPressureLog[] };
}

export async function getTodayBloodPressureLogsAction() {
  return getBloodPressureLogsForDayAction(toDateKey());
}

export async function saveBloodPressureLogAction(
  values: BloodPressureFormValues,
  id?: string,
) {
  const parsed = bloodPressureFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Проверьте введённые значения" };

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const payload = mapForm(parsed.data, user.id);
  const { data, error } = id
    ? await supabase.from("blood_pressure_logs").update(payload).eq("id", id).select().single()
    : await supabase.from("blood_pressure_logs").insert(payload).select().single();

  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  return { data: data as BloodPressureLog };
}

export async function deleteBloodPressureLogAction(id: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const { error } = await supabase.from("blood_pressure_logs").delete().eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  return { success: true };
}
