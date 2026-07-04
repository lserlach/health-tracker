"use server";

import { revalidatePath } from "next/cache";
import { addHours } from "date-fns";
import { fromDatetimeLocalValue } from "@/lib/dates/format";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import { mealFormSchema, type MealFormValues } from "@/features/meals/lib/validation";
import type { MealLog } from "@/types/database.types";

export async function saveMealLogAction(values: MealFormValues) {
  const parsed = mealFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Проверьте введённые значения" };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const eatenAt = fromDatetimeLocalValue(parsed.data.eaten_at);
  const remindAt = addHours(eatenAt, 1);

  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      user_id: user.id,
      eaten_at: eatenAt.toISOString(),
      meal_text: parsed.data.meal_text.trim(),
      remind_at: remindAt.toISOString(),
    })
    .select()
    .single();

  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  return { data: data as MealLog };
}

export async function getTodayMealLogsAction(start: string, end: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: [] as MealLog[] };

  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .gte("eaten_at", start)
    .lte("eaten_at", end)
    .order("eaten_at", { ascending: false });

  if (error) return { error: formatSupabaseError(error), data: [] as MealLog[] };
  return { data: (data ?? []) as MealLog[] };
}
