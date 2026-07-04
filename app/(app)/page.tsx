import { createClient } from "@/lib/supabase/server";
import { getTodayRange } from "@/lib/dates/format";
import { ensureTodayMedicationLogs } from "@/features/medications/services/generate-daily-logs";
import { getPregnancySummary } from "@/lib/pregnancy/calculate";
import { HomePageClient } from "@/features/dashboard/components/home-page-client";

export default async function HomePage() {
  const supabase = await createClient();
  const { start, end } = getTodayRange();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profilePromise = user
    ? supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : Promise.resolve({ data: null });

  const [glucoseRes, bpRes, weightRes, medicationLogsResult, profileRes] = await Promise.all([
    supabase
      .from("glucose_logs")
      .select("*")
      .gte("measured_at", start)
      .lte("measured_at", end)
      .order("measured_at", { ascending: false }),
    supabase
      .from("blood_pressure_logs")
      .select("*")
      .gte("measured_at", start)
      .lte("measured_at", end)
      .order("measured_at", { ascending: false })
      .limit(1),
    supabase
      .from("weight_logs")
      .select("*")
      .gte("measured_at", start)
      .lte("measured_at", end)
      .order("measured_at", { ascending: false })
      .limit(1),
    user ? ensureTodayMedicationLogs(supabase, user.id) : Promise.resolve({ data: [] }),
    profilePromise,
  ]);

  const profile = profileRes.data ?? null;
  const pregnancy = getPregnancySummary(
    profile?.last_menstrual_date,
    profile?.due_date,
  );

  const glucoseLogs = glucoseRes.data ?? [];
  const lastGlucose = glucoseLogs[0] ?? null;
  const hasHighGlucoseToday = glucoseLogs.some((log) => log.is_high);
  const lastBp = bpRes.data?.[0] ?? null;
  const lastWeight = weightRes.data?.[0] ?? null;
  const medicationLogs = medicationLogsResult.data ?? [];
  const medicationTaken = medicationLogs.filter((log) => log.status === "taken").length;

  return (
    <HomePageClient
      lastGlucose={lastGlucose}
      hasHighGlucoseToday={hasHighGlucoseToday}
      lastBp={lastBp}
      lastWeight={lastWeight}
      medicationTaken={medicationTaken}
      medicationTotal={medicationLogs.length}
      pregnancyWeek={pregnancy.week}
      daysUntilDue={pregnancy.daysUntilDue}
      dueDate={pregnancy.dueDateLabel}
    />
  );
}
