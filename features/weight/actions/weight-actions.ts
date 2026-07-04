"use server";

import { revalidatePath } from "next/cache";
import { fromDatetimeLocalValue, getDayRange } from "@/lib/dates/format";
import { parseDateKey, toDateKey } from "@/lib/dates/day";
import { getAuthenticatedUser, ensureUserRecords } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import {
  weightFormSchema,
  type WeightFormValues,
} from "@/features/weight/lib/validation";
import type { WeightLog } from "@/types/database.types";

function mapForm(values: WeightFormValues, userId: string) {
  return {
    user_id: userId,
    measured_at: fromDatetimeLocalValue(values.measured_at).toISOString(),
    weight: values.weight,
  };
}

export async function getWeightLogsForDayAction(dateKey: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: [] as WeightLog[] };

  const { start, end } = getDayRange(parseDateKey(dateKey));

  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .gte("measured_at", start)
    .lte("measured_at", end)
    .order("measured_at", { ascending: false });

  if (error) return { error: formatSupabaseError(error), data: [] as WeightLog[] };
  return { data: (data ?? []) as WeightLog[] };
}

export async function getWeightLogsAction() {
  return getWeightLogsForDayAction(toDateKey());
}

export async function saveWeightLogAction(values: WeightFormValues, id?: string) {
  const parsed = weightFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Проверьте введённые значения" };

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  await ensureUserRecords(user.id, user.email ?? "");

  const payload = mapForm(parsed.data, user.id);
  const { error } = id
    ? await supabase.from("weight_logs").update(payload).eq("id", id)
    : await supabase.from("weight_logs").insert(payload);

  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}

export async function deleteWeightLogAction(id: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  await ensureUserRecords(user.id, user.email ?? "");

  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}
