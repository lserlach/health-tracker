"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import { calculatePregnancyWeek } from "@/lib/pregnancy/calculate";
import {
  formValuesToProfileUpdate,
  formValuesToSettingsUpdate,
  DUPLICATE_NOTIFICATION_TIME_MESSAGE,
  settingsFormSchema,
  type SettingsFormValues,
} from "@/features/settings/lib/validation";
import type { Profile, Settings } from "@/types/database.types";

export async function getSettingsDataAction() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, profile: null, settings: null };

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  if (profileRes.error) return { error: formatSupabaseError(profileRes.error), profile: null, settings: null };
  if (settingsRes.error) return { error: formatSupabaseError(settingsRes.error), profile: null, settings: null };

  return {
    profile: (profileRes.data ?? null) as Profile | null,
    settings: (settingsRes.data ?? null) as Settings | null,
  };
}

export async function saveSettingsAction(values: SettingsFormValues) {
  const parsed = settingsFormSchema.safeParse(values);
  if (!parsed.success) {
    const duplicateIssue = parsed.error.issues.find(
      (issue) => issue.message === DUPLICATE_NOTIFICATION_TIME_MESSAGE,
    );
    return { error: duplicateIssue?.message ?? "Проверьте введённые значения" };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const pregnancyWeek = calculatePregnancyWeek(parsed.data.last_menstrual_date);
  const profileUpdate = formValuesToProfileUpdate(parsed.data, pregnancyWeek);
  const settingsUpdate = formValuesToSettingsUpdate(parsed.data);

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").update(profileUpdate).eq("id", user.id),
    supabase.from("settings").update(settingsUpdate).eq("user_id", user.id),
  ]);

  if (profileRes.error) return { error: formatSupabaseError(profileRes.error) };
  if (settingsRes.error) return { error: formatSupabaseError(settingsRes.error) };

  revalidatePath("/");
  revalidatePath("/glucose");
  revalidatePath("/reports");
  revalidatePath("/settings");
  return { success: true };
}
