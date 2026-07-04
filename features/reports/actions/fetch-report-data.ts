"use server";

import { getAuthenticatedUser, ensureUserRecords } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import { computeReportData, formatPeriodLabel } from "@/features/reports/lib/compute-report-data";
import {
  getReportDateRange,
  REPORT_PERIOD_OPTIONS,
  type ReportPeriod,
} from "@/features/reports/lib/report-periods";
import type { ReportData } from "@/features/reports/lib/report-types";

export interface FetchReportDataInput {
  period: ReportPeriod;
  customFrom?: string;
  customTo?: string;
}

export async function fetchReportDataAction(
  input: FetchReportDataInput,
): Promise<{ data?: ReportData; error?: string }> {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  await ensureUserRecords(user.id, user.email ?? "");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const { from, to } = getReportDateRange(
    input.period,
    input.customFrom,
    input.customTo,
    profile?.tracking_start_date ?? null,
  );

  const periodLabel =
    REPORT_PERIOD_OPTIONS.find((item) => item.value === input.period)?.label ??
    formatPeriodLabel(from, to);

  const [settingsRes, glucoseRes, bpRes, weightRes, medsRes, medLogsRes] = await Promise.all([
    supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("glucose_logs")
      .select("*")
      .gte("measured_at", from.toISOString())
      .lte("measured_at", to.toISOString())
      .order("measured_at", { ascending: true }),
    supabase
      .from("blood_pressure_logs")
      .select("*")
      .gte("measured_at", from.toISOString())
      .lte("measured_at", to.toISOString())
      .order("measured_at", { ascending: true }),
    supabase
      .from("weight_logs")
      .select("*")
      .gte("measured_at", from.toISOString())
      .lte("measured_at", to.toISOString())
      .order("measured_at", { ascending: true }),
    supabase.from("medications").select("*").order("name", { ascending: true }),
    supabase
      .from("medication_logs")
      .select("*")
      .gte("scheduled_for", from.toISOString())
      .lte("scheduled_for", to.toISOString())
      .order("scheduled_for", { ascending: true }),
  ]);

  const firstError =
    settingsRes.error ??
    glucoseRes.error ??
    bpRes.error ??
    weightRes.error ??
    medsRes.error ??
    medLogsRes.error;

  if (firstError) {
    return { error: formatSupabaseError(firstError) };
  }

  const data = computeReportData({
    profile: profile ?? null,
    settings: settingsRes.data ?? null,
    glucoseLogs: glucoseRes.data ?? [],
    bloodPressureLogs: bpRes.data ?? [],
    weightLogs: weightRes.data ?? [],
    medications: medsRes.data ?? [],
    medicationLogs: medLogsRes.data ?? [],
    dateFrom: from,
    dateTo: to,
    periodLabel:
      input.period === "custom" ? formatPeriodLabel(from, to) : periodLabel,
  });

  return { data };
}
