import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type {
  BloodPressureLog,
  GlucoseLog,
  Medication,
  MedicationLog,
  Profile,
  Settings,
  WeightLog,
} from "@/types/database.types";
import {
  buildMedicationReportRows,
  calculateMedicationAdherence,
} from "./build-medication-report";
import type { GlucoseStats, ReportData, WeightLogWithDelta } from "./report-types";

function computeGlucoseStats(logs: GlucoseLog[]): GlucoseStats {
  if (logs.length === 0) {
    return { count: 0, highCount: 0, avg: null, min: null, max: null };
  }

  const values = logs.map((log) => Number(log.value));
  const sum = values.reduce((acc, value) => acc + value, 0);

  return {
    count: logs.length,
    highCount: logs.filter((log) => log.is_high).length,
    avg: Number((sum / values.length).toFixed(1)),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function mapWeightLogs(logs: WeightLog[], startWeight: number | null): WeightLogWithDelta[] {
  return logs.map((log) => ({
    id: log.id,
    measured_at: log.measured_at,
    weight: Number(log.weight),
    deltaFromStart:
      startWeight != null ? Number((Number(log.weight) - startWeight).toFixed(1)) : null,
  }));
}

export function computeReportData(input: {
  profile: Profile | null;
  settings: Settings | null;
  glucoseLogs: GlucoseLog[];
  bloodPressureLogs: BloodPressureLog[];
  weightLogs: WeightLog[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  dateFrom: Date;
  dateTo: Date;
  periodLabel: string;
}): ReportData {
  const glucoseStats = computeGlucoseStats(input.glucoseLogs);
  const medicationRows = buildMedicationReportRows(
    input.medications,
    input.medicationLogs,
    input.dateFrom,
    input.dateTo,
  );

  return {
    profile: input.profile,
    settings: input.settings,
    periodLabel: input.periodLabel,
    dateFrom: input.dateFrom.toISOString(),
    dateTo: input.dateTo.toISOString(),
    glucoseLogs: input.glucoseLogs,
    glucoseStats,
    highGlucoseLogs: input.glucoseLogs.filter((log) => log.is_high),
    bloodPressureLogs: input.bloodPressureLogs,
    weightLogs: mapWeightLogs(input.weightLogs, input.profile?.start_weight ?? null),
    medicationRows,
    medicationAdherence: calculateMedicationAdherence(medicationRows),
    generatedAt: new Date().toISOString(),
  };
}

export function formatPeriodLabel(dateFrom: Date, dateTo: Date) {
  return `${format(dateFrom, "d MMM yyyy", { locale: ru })} — ${format(dateTo, "d MMM yyyy", { locale: ru })}`;
}
