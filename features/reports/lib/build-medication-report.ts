import { eachDayOfInterval, endOfDay, format, isBefore, parseISO } from "date-fns";
import { buildScheduledFor } from "@/features/medications/services/generate-daily-logs";
import type { Medication, MedicationLog } from "@/types/database.types";
import type { MedicationReportRow } from "./report-types";

function logKey(medicationId: string, scheduledFor: string) {
  return `${medicationId}:${scheduledFor}`;
}

export function buildMedicationReportRows(
  medications: Medication[],
  logs: MedicationLog[],
  dateFrom: Date,
  dateTo: Date,
): MedicationReportRow[] {
  const logMap = new Map(logs.map((log) => [logKey(log.medication_id, log.scheduled_for), log]));
  const days = eachDayOfInterval({ start: dateFrom, end: dateTo });
  const now = new Date();
  const rows: MedicationReportRow[] = [];

  for (const day of days) {
    for (const medication of medications) {
      const times = (medication.schedule_times as string[]) ?? [];
      for (const time of times.filter(Boolean)) {
        const scheduledFor = buildScheduledFor(day, time);
        const scheduledDate = parseISO(scheduledFor);
        const log = logMap.get(logKey(medication.id, scheduledFor));

        let status: MedicationReportRow["status"];
        if (log?.status === "taken" || log?.status === "skipped") {
          status = log.status;
        } else if (log?.status === "pending") {
          status = isBefore(scheduledDate, now) ? "missing" : "pending";
        } else if (isBefore(endOfDay(day), startOfDaySafe(now)) || isBefore(scheduledDate, now)) {
          status = "missing";
        } else {
          status = "pending";
        }

        rows.push({
          date: format(day, "yyyy-MM-dd"),
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduledFor,
          status,
        });
      }
    }
  }

  return rows.sort(
    (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
  );
}

function startOfDaySafe(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function calculateMedicationAdherence(rows: MedicationReportRow[]) {
  const relevant = rows.filter((row) => row.status !== "pending");
  if (relevant.length === 0) return null;

  const taken = relevant.filter((row) => row.status === "taken").length;
  return Math.round((taken / relevant.length) * 100);
}
