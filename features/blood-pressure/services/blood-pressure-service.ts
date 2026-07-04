import { createClient } from "@/lib/supabase/client";
import type { BloodPressureLog } from "@/types/database.types";
import type { BloodPressureFormValues } from "@/features/blood-pressure/lib/validation";
import { parsePulse } from "@/features/blood-pressure/lib/validation";
import { fromDatetimeLocalValue } from "@/lib/dates/format";

function mapForm(values: BloodPressureFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    systolic: values.systolic,
    diastolic: values.diastolic,
    pulse: parsePulse(values.pulse),
  };
}

export async function fetchTodayBloodPressureLogs() {
  const supabase = createClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("blood_pressure_logs")
    .select("*")
    .gte("measured_at", start.toISOString())
    .lte("measured_at", end.toISOString())
    .order("measured_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BloodPressureLog[];
}

export async function createBloodPressureLog(values: BloodPressureFormValues, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blood_pressure_logs")
    .insert(mapForm(values, userId))
    .select("*")
    .single();
  if (error) throw error;
  return data as BloodPressureLog;
}

export async function updateBloodPressureLog(
  id: string,
  values: BloodPressureFormValues,
  userId: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blood_pressure_logs")
    .update(mapForm(values, userId))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as BloodPressureLog;
}

export async function deleteBloodPressureLog(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("blood_pressure_logs").delete().eq("id", id);
  if (error) throw error;
}
