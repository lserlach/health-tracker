import { createClient } from "@/lib/supabase/server";
import { getTodayRange } from "@/lib/dates/format";
import { ensureTodayMedicationLogs } from "@/features/medications/services/generate-daily-logs";
import { getPregnancySummary } from "@/lib/pregnancy/calculate";
import { HomePageClient } from "@/features/dashboard/components/home-page-client";
import {
  areNotificationsConfigured,
  buildTodayNotificationQueue,
} from "@/features/notifications/lib/today-notification-queue";

export default async function HomePage() {
  const supabase = await createClient();
  const { start, end } = getTodayRange();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profilePromise = user
    ? supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : Promise.resolve({ data: null });

  const settingsPromise = user
    ? supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle()
    : Promise.resolve({ data: null });

  const mealLogsPromise = user
    ? supabase
        .from("meal_logs")
        .select("*")
        .gte("eaten_at", start)
        .lte("eaten_at", end)
        .order("eaten_at", { ascending: false })
    : Promise.resolve({ data: [] });

  const [glucoseRes, bpRes, weightRes, medicationLogsResult, profileRes, settingsRes, mealLogsRes] =
    await Promise.all([
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
      settingsPromise,
      mealLogsPromise,
    ]);

  const profile = profileRes.data ?? null;
  const settings = settingsRes.data ?? null;
  const mealLogs = mealLogsRes.data ?? [];
  const pregnancy = getPregnancySummary(
    profile?.last_menstrual_date,
    profile?.due_date,
  );

  const glucoseLogs = glucoseRes.data ?? [];
  const lastGlucose = glucoseLogs[0] ?? null;
  const lastBp = bpRes.data?.[0] ?? null;
  const lastWeight = weightRes.data?.[0] ?? null;
  const medicationLogs = medicationLogsResult.data ?? [];

  const dailyProgress = {
    glucose: glucoseLogs.length > 0,
    medication:
      medicationLogs.length > 0 &&
      medicationLogs.every((log) => log.status === "taken" || log.status === "skipped"),
    bloodPressure: Boolean(lastBp),
    weight: Boolean(lastWeight),
  };

  const upcomingNotifications = buildTodayNotificationQueue({
    settings,
    medicationLogs: medicationLogs.map((log) => ({
      id: log.id,
      scheduled_for: log.scheduled_for,
      status: log.status,
      medications: log.medications,
    })),
    mealLogs: mealLogs.map((meal) => ({
      id: meal.id,
      meal_text: meal.meal_text,
      remind_at: meal.remind_at,
      reminder_sent: meal.reminder_sent,
    })),
  });

  return (
    <HomePageClient
      lastGlucose={lastGlucose}
      todayGlucoseLogs={glucoseLogs}
      lastBp={lastBp}
      medicationLogs={medicationLogs}
      dailyProgress={dailyProgress}
      pregnancyAgeLabel={pregnancy.ageLabel}
      pregnancyProgress={pregnancy.progress}
      daysUntilDue={pregnancy.daysUntilDue}
      upcomingNotifications={upcomingNotifications}
      notificationsEnabled={settings?.notifications_enabled ?? false}
      hasActiveNotificationRules={areNotificationsConfigured(settings)}
    />
  );
}
