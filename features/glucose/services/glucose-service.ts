import { createClient } from "@/lib/supabase/client";
import type { GlucoseLog } from "@/types/database.types";
import type { GlucoseFormValues } from "@/features/glucose/lib/validation";
import { fromDatetimeLocalValue } from "@/lib/dates/format";

function mapFormToInsert(values: GlucoseFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    value: values.value,
    measurement_type: values.measurement_type,
    meal_text:
      values.measurement_type === "after_meal" ? values.meal_text?.trim() || null : null,
    minutes_after_meal:
      values.measurement_type === "after_meal"
        ? values.minutes_after_meal ?? 60
        : null,
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
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("glucose_logs")
    .select("*")
    .gte("measured_at", start.toISOString())
    .lte("measured_at", end.toISOString())
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
