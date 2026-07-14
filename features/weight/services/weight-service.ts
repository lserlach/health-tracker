import { createClient } from "@/lib/supabase/client";
import { getReminderDateKey } from "@/lib/dates/reminder-timezone";
import type { WeightLog } from "@/types/database.types";
import type { WeightFormValues } from "@/features/weight/lib/validation";
import { fromDatetimeLocalValue } from "@/lib/dates/format";

function mapForm(values: WeightFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    weight: values.weight,
  };
}

export async function fetchWeightLogs(limit = 100) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .order("measured_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WeightLog[];
}

export async function fetchTodayWeightLog() {
  const logs = await fetchWeightLogs(30);
  const todayKey = getReminderDateKey();
  return logs.find((log) => getReminderDateKey(new Date(log.measured_at)) === todayKey) ?? null;
}

export async function createWeightLog(values: WeightFormValues, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .insert(mapForm(values, userId))
    .select("*")
    .single();
  if (error) throw error;
  return data as WeightLog;
}

export async function updateWeightLog(id: string, values: WeightFormValues, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .update(mapForm(values, userId))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as WeightLog;
}

export async function deleteWeightLog(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw error;
}
