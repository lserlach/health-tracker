import { getDayRange } from "@/lib/dates/format";
import type { Medication, MedicationLog } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MedicationLogWithMedication extends MedicationLog {
  medications: Pick<Medication, "name" | "dosage" | "icon" | "intake_relation">;
}

export function buildScheduledFor(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const scheduled = new Date(date);
  scheduled.setHours(hours, minutes, 0, 0);
  return scheduled.toISOString();
}

export async function ensureTodayMedicationLogs(
  supabase: SupabaseClient,
  userId: string,
  date: Date = new Date(),
) {
  const { start, end } = getDayRange(date);

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

  if (rows.length > 0) {
    await supabase.from("medication_logs").upsert(rows, {
      onConflict: "medication_id,scheduled_for",
      ignoreDuplicates: true,
    });
  }

  const { data: logs, error: logsError } = await supabase
    .from("medication_logs")
    .select("*, medications(name, dosage, icon, intake_relation)")
    .eq("user_id", userId)
    .gte("scheduled_for", start)
    .lte("scheduled_for", end)
    .order("scheduled_for", { ascending: true });

  if (logsError) {
    return { error: logsError.message, data: [] as MedicationLogWithMedication[] };
  }

  return { data: (logs ?? []) as MedicationLogWithMedication[] };
}
