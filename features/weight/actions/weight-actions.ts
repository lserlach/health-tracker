"use server";

import { revalidatePath } from "next/cache";
import { endOfDay, subDays } from "date-fns";
import { fromDatetimeLocalValue, getDayRange } from "@/lib/dates/format";
import { parseDateKey, toDateKey } from "@/lib/dates/day";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import {
  weightFormSchema,
  type WeightFormValues,
} from "@/features/weight/lib/validation";
import type { WeightLog } from "@/types/database.types";

export interface WeightStats {
  gain7Days: number | null;
  gainAllTime: number | null;
}

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

export async function getWeightStatsAction(dateKey: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: null as WeightStats | null };

  const referenceDate = parseDateKey(dateKey);
  const referenceEnd = endOfDay(referenceDate).toISOString();
  const sevenDaysAgoEnd = endOfDay(subDays(referenceDate, 7)).toISOString();

  const [latestResult, pastResult, profileResult, firstResult] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight")
      .lte("measured_at", referenceEnd)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("weight_logs")
      .select("weight")
      .lte("measured_at", sevenDaysAgoEnd)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("start_weight").eq("id", user.id).maybeSingle(),
    supabase
      .from("weight_logs")
      .select("weight")
      .order("measured_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (latestResult.error) {
    return { error: formatSupabaseError(latestResult.error), data: null };
  }

  const latestWeight = latestResult.data ? Number(latestResult.data.weight) : null;
  const pastWeight = pastResult.data ? Number(pastResult.data.weight) : null;
  const startWeight =
    profileResult.data?.start_weight != null ? Number(profileResult.data.start_weight) : null;
  const firstWeight = firstResult.data ? Number(firstResult.data.weight) : null;
  const baselineWeight = startWeight ?? firstWeight;

  const gain7Days =
    latestWeight != null && pastWeight != null
      ? Number((latestWeight - pastWeight).toFixed(1))
      : null;

  const gainAllTime =
    latestWeight != null && baselineWeight != null
      ? Number((latestWeight - baselineWeight).toFixed(1))
      : null;

  return {
    data: {
      gain7Days,
      gainAllTime,
    },
  };
}

export async function getWeightLogsAction() {
  return getWeightLogsForDayAction(toDateKey());
}

export async function saveWeightLogAction(values: WeightFormValues, id?: string) {
  const parsed = weightFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Проверьте введённые значения" };

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const payload = mapForm(parsed.data, user.id);
  const { data, error } = id
    ? await supabase.from("weight_logs").update(payload).eq("id", id).select().single()
    : await supabase.from("weight_logs").insert(payload).select().single();

  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  return { data: data as WeightLog };
}

export async function deleteWeightLogAction(id: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  return { success: true };
}
