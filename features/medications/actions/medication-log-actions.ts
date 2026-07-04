"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import { parseDateKey, toDateKey } from "@/lib/dates/day";
import {
  ensureTodayMedicationLogs,
  fetchMedicationLogsForDay,
  type MedicationLogWithMedication,
} from "@/features/medications/services/generate-daily-logs";
import type { MedicationLogStatus } from "@/types/database.types";

export async function getMedicationLogsForDayAction(dateKey: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: [] as MedicationLogWithMedication[] };

  const date = parseDateKey(dateKey);
  const result =
    dateKey === toDateKey()
      ? await ensureTodayMedicationLogs(supabase, user.id, date)
      : await fetchMedicationLogsForDay(supabase, user.id, date);

  if (result.error) return { error: result.error, data: [] };
  return { data: result.data };
}

export async function getTodayMedicationLogsAction() {
  return getMedicationLogsForDayAction(toDateKey());
}

export async function updateMedicationLogStatusAction(
  id: string,
  status: MedicationLogStatus,
  takenAt?: string,
) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const payload =
    status === "taken"
      ? { status, taken_at: takenAt ?? new Date().toISOString() }
      : { status, taken_at: null };

  const { error } = await supabase.from("medication_logs").update(payload).eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/");
  return { success: true };
}
