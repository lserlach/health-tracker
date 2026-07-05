"use server";

import { revalidatePath } from "next/cache";
import { fromDatetimeLocalValue, getDayRange } from "@/lib/dates/format";
import { parseDateKey, toDateKey } from "@/lib/dates/day";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import {
  FASTING_ONCE_PER_DAY_ERROR,
  glucoseFormSchema,
  type GlucoseFormValues,
} from "@/features/glucose/lib/validation";
import { calcMinutesAfterMeal } from "@/features/glucose/lib/pending-meal-glucose";
import type { GlucoseLog, MealLog } from "@/types/database.types";

async function assertSingleFastingPerDay(
  supabase: Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"],
  userId: string,
  measuredAt: Date,
  excludeLogId?: string,
) {
  const { start, end } = getDayRange(measuredAt);

  let query = supabase
    .from("glucose_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("measurement_type", "fasting")
    .gte("measured_at", start)
    .lte("measured_at", end)
    .limit(1);

  if (excludeLogId) {
    query = query.neq("id", excludeLogId);
  }

  const { data, error } = await query;

  if (error) {
    return { error: formatSupabaseError(error) };
  }

  if ((data ?? []).length > 0) {
    return { error: FASTING_ONCE_PER_DAY_ERROR };
  }

  return {};
}

function mapForm(
  values: GlucoseFormValues,
  userId: string,
  options?: { eatenAt?: string },
) {
  const measuredAt = fromDatetimeLocalValue(values.measured_at);
  const minutesAfterMeal =
    values.measurement_type === "after_meal" && options?.eatenAt
      ? calcMinutesAfterMeal(options.eatenAt, measuredAt)
      : null;

  return {
    user_id: userId,
    measured_at: measuredAt.toISOString(),
    value: values.value,
    measurement_type: values.measurement_type,
    meal_text:
      values.measurement_type === "after_meal" ? values.meal_text?.trim() || null : null,
    minutes_after_meal: minutesAfterMeal,
  };
}

async function filterPendingMealLogs(
  supabase: Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"],
  userId: string,
  meals: MealLog[],
) {
  const pending: MealLog[] = [];

  for (const meal of meals) {
    const { count, error } = await supabase
      .from("glucose_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("measurement_type", "after_meal")
      .gte("measured_at", meal.eaten_at);

    if (error) {
      return { error: formatSupabaseError(error), data: [] as MealLog[] };
    }

    if ((count ?? 0) === 0) {
      pending.push(meal);
    }
  }

  return { data: pending };
}

export async function getGlucoseDayDataAction(dateKey: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) {
    return {
      error: authError,
      logs: [] as GlucoseLog[],
      pendingMeals: [] as MealLog[],
    };
  }

  const { start, end } = getDayRange(parseDateKey(dateKey));

  const [logsResult, mealsResult] = await Promise.all([
    supabase
      .from("glucose_logs")
      .select("*")
      .gte("measured_at", start)
      .lte("measured_at", end)
      .order("measured_at", { ascending: false }),
    supabase
      .from("meal_logs")
      .select("*")
      .gte("eaten_at", start)
      .lte("eaten_at", end)
      .order("eaten_at", { ascending: false }),
  ]);

  if (logsResult.error) {
    return {
      error: formatSupabaseError(logsResult.error),
      logs: [] as GlucoseLog[],
      pendingMeals: [] as MealLog[],
    };
  }

  if (mealsResult.error) {
    return {
      error: formatSupabaseError(mealsResult.error),
      logs: (logsResult.data ?? []) as GlucoseLog[],
      pendingMeals: [] as MealLog[],
    };
  }

  const pendingResult = await filterPendingMealLogs(
    supabase,
    user.id,
    (mealsResult.data ?? []) as MealLog[],
  );

  if (pendingResult.error) {
    return {
      error: pendingResult.error,
      logs: (logsResult.data ?? []) as GlucoseLog[],
      pendingMeals: [] as MealLog[],
    };
  }

  return {
    logs: (logsResult.data ?? []) as GlucoseLog[],
    pendingMeals: pendingResult.data,
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
  options?: { mealLogId?: string; eatenAt?: string },
) {
  const parsed = glucoseFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Проверьте введённые значения" };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  if (parsed.data.measurement_type === "fasting") {
    const fastingError = await assertSingleFastingPerDay(
      supabase,
      user.id,
      fromDatetimeLocalValue(parsed.data.measured_at),
      id,
    );
    if (fastingError.error) {
      return { error: fastingError.error };
    }
  }

  const payload = mapForm(parsed.data, user.id, { eatenAt: options?.eatenAt });

  const { data, error } = id
    ? await supabase.from("glucose_logs").update(payload).eq("id", id).select().single()
    : await supabase.from("glucose_logs").insert(payload).select().single();

  if (error) return { error: formatSupabaseError(error) };

  if (options?.mealLogId) {
    await supabase
      .from("meal_logs")
      .update({ reminder_sent: true })
      .eq("id", options.mealLogId)
      .eq("user_id", user.id);
  }

  revalidatePath("/");
  revalidatePath("/glucose");
  return { data: data as GlucoseLog };
}

export async function deleteGlucoseLogAction(id: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const { error } = await supabase.from("glucose_logs").delete().eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  revalidatePath("/glucose");
  return { success: true };
}
