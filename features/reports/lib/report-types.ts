import type {
  BloodPressureLog,
  GlucoseLog,
  Medication,
  MedicationLog,
  Profile,
  Settings,
} from "@/types/database.types";

export interface MedicationReportRow {
  date: string;
  medicationName: string;
  dosage: string;
  scheduledFor: string;
  status: "taken" | "skipped" | "pending" | "missing";
}

export interface GlucoseStats {
  count: number;
  highCount: number;
  avg: number | null;
  min: number | null;
  max: number | null;
}

export interface ReportData {
  profile: Profile | null;
  settings: Settings | null;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  glucoseLogs: GlucoseLog[];
  glucoseStats: GlucoseStats;
  highGlucoseLogs: GlucoseLog[];
  bloodPressureLogs: BloodPressureLog[];
  weightLogs: WeightLogWithDelta[];
  medicationRows: MedicationReportRow[];
  medicationAdherence: number | null;
  generatedAt: string;
}

export interface WeightLogWithDelta {
  id: string;
  measured_at: string;
  weight: number;
  deltaFromStart: number | null;
}

export interface ReportFetchInput {
  period: import("./report-periods").ReportPeriod;
  customFrom?: string;
  customTo?: string;
}

export interface ReportPayload {
  profile: Profile | null;
  settings: Settings | null;
  glucoseLogs: GlucoseLog[];
  bloodPressureLogs: BloodPressureLog[];
  weightLogs: import("@/types/database.types").WeightLog[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
}
