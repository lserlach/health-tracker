import {
  buildReminderDateTime,
  getReminderDateKey,
  getReminderDayRange,
} from "@/lib/dates/reminder-timezone";
import type { Medication, MedicationLog } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MedicationLogWithMedication extends MedicationLog {
  medications: Pick<Medication, "name" | "dosage" | "icon" | "icon_color" | "intake_relation">;
}

export function buildScheduledFor(date: Date, time: string) {
  const dateKey = getReminderDateKey(date);
  return buildReminderDateTime(dateKey, time).toISOString();
}

function getDayRange(date: Date) {
  const { start, end } = getReminderDayRange(date);
  return { start, end };
}

export async function fetchMedicationLogsForDay(
  supabase: SupabaseClient,
  userId: string,
  date: Date,
) {
  const { start, end } = getDayRange(date);

  const { data: logs, error: logsError } = await supabase
    .from("medication_logs")
    .select("*, medications(name, dosage, icon, icon_color, intake_relation)")
    .eq("user_id", userId)
    .gte("scheduled_for", start)
    .lte("scheduled_for", end)
    .order("scheduled_for", { ascending: true });

  if (logsError) {
    return { error: logsError.message, data: [] as MedicationLogWithMedication[] };
  }

  return { data: (logs ?? []) as MedicationLogWithMedication[] };
}

export async function ensureTodayMedicationLogs(
  supabase: SupabaseClient,
  userId: string,
  date: Date = new Date(),
) {
  const { data: medications, error: medsError } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (medsError) {
    return { error: medsError.message, data: [] as MedicationLogWithMedication[] };
  }

  const rows = (medications ?? []).flatMap((medication) => {
    const times = (medication.schedule_times as string[]) ?? [];
    return times
      .filter(Boolean)
      .map((time) => ({
        user_id: userId,
        medication_id: medication.id,
        scheduled_for: buildScheduledFor(date, time),
        status: "pending" as const,
      }));
  });

  const { start, end } = getDayRange(date);
  const expectedScheduledFor = new Set(rows.map((row) => row.scheduled_for));

  const { data: existingLogs } = await supabase
    .from("medication_logs")
    .select("id, scheduled_for, status")
    .eq("user_id", userId)
    .gte("scheduled_for", start)
    .lte("scheduled_for", end)
    .eq("status", "pending");

  const staleLogIds = (existingLogs ?? [])
    .filter((log) => !expectedScheduledFor.has(log.scheduled_for))
    .map((log) => log.id);

  if (staleLogIds.length > 0) {
    await supabase.from("medication_logs").delete().in("id", staleLogIds);
  }

  if (rows.length > 0) {
    await supabase.from("medication_logs").upsert(rows, {
      onConflict: "medication_id,scheduled_for",
      ignoreDuplicates: true,
    });
  }

  return fetchMedicationLogsForDay(supabase, userId, date);
}
