import { createClient } from "@/lib/supabase/client";
import { getReminderDayRange } from "@/lib/dates/reminder-timezone";
import type { GlucoseLog } from "@/types/database.types";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";
import { fromDatetimeLocalValue } from "@/lib/dates/format";

function mapFormToInsert(values: GlucoseFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    value: values.value,
    measurement_type: values.measurement_type,
    meal_slot:
      values.measurement_type === "after_meal" ? values.meal_slot ?? null : null,
    meal_text:
      values.measurement_type === "after_meal" ? values.meal_text?.trim() || null : null,
    minutes_after_meal: null,
  };
}

export async function fetchGlucoseLogs(limit = 100) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("glucose_logs")
    .select("*")
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as GlucoseLog[];
}

export async function fetchTodayGlucoseLogs() {
  const supabase = createClient();
  const { start, end } = getReminderDayRange();

  const { data, error } = await supabase
    .from("glucose_logs")
    .select("*")
    .gte("measured_at", start)
    .lte("measured_at", end)
    .order("measured_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as GlucoseLog[];
}

export async function createGlucoseLog(values: GlucoseFormValues, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("glucose_logs")
    .insert(mapFormToInsert(values, userId))
    .select("*")
    .single();

  if (error) throw error;
  return data as GlucoseLog;
}

export async function updateGlucoseLog(
  id: string,
  values: GlucoseFormValues,
  userId: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("glucose_logs")
    .update(mapFormToInsert(values, userId))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as GlucoseLog;
}

export async function deleteGlucoseLog(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("glucose_logs").delete().eq("id", id);
  if (error) throw error;
}
