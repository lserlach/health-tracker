"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DailyProgressTracker, type DailyProgressStatus } from "@/features/dashboard/components/daily-progress-tracker";
import { HomeQuickActions } from "@/features/dashboard/components/home-quick-actions";
import { PregnancyProgressBar } from "@/features/dashboard/components/pregnancy-progress-bar";
import { UpcomingNotificationsSection } from "@/features/dashboard/components/upcoming-notifications-section";
import { isElevatedBloodPressure } from "@/features/blood-pressure/lib/validation";
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import type { TodayNotificationItem } from "@/features/notifications/lib/today-notification-queue";
import type { PregnancyProgress } from "@/lib/pregnancy/calculate";
import { formatTodayHeaderDate } from "@/lib/dates/format";
import type { BloodPressureLog, GlucoseLog } from "@/types/database.types";

interface HomePageClientProps {
  lastGlucose: GlucoseLog | null;
  todayGlucoseLogs: GlucoseLog[];
  lastBp: BloodPressureLog | null;
  medicationLogs: MedicationLogWithMedication[];
  dailyProgress: DailyProgressStatus;
  pregnancyAgeLabel: string | null;
  pregnancyProgress: PregnancyProgress | null;
  daysUntilDue: number | null;
  upcomingNotifications: TodayNotificationItem[];
  notificationsEnabled: boolean;
  hasActiveNotificationRules: boolean;
}

function formatDaysWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}

function formatDueLabel(daysUntilDue: number | null) {
  if (daysUntilDue == null) return null;

  const absDays = Math.abs(daysUntilDue);
  const daysWord = formatDaysWord(absDays);

  if (daysUntilDue < 0) {
    return `Роды были ${absDays} ${daysWord} назад`;
  }
  if (daysUntilDue === 0) {
    return "Роды сегодня";
  }
  return `До родов: ${absDays} ${daysWord}`;
}

export function HomePageClient({
  lastGlucose,
  todayGlucoseLogs,
  lastBp,
  medicationLogs,
  dailyProgress,
  pregnancyAgeLabel,
  pregnancyProgress,
  daysUntilDue,
  upcomingNotifications,
  notificationsEnabled,
  hasActiveNotificationRules,
}: HomePageClientProps) {
  const daysUntilBirthLabel = formatDueLabel(daysUntilDue);

  return (
    <PageContainer>
      <AppHeader title={`Сегодня, ${formatTodayHeaderDate()}`} showActions className="mb-2" />

      {pregnancyAgeLabel ? (
        <Card className="mb-4 border-0 bg-primary-gradient text-white shadow-md shadow-primary/25">
          <div>
            <p className="text-sm text-white/75">Текущий срок</p>
            <p className="font-heading text-2xl font-semibold">{pregnancyAgeLabel}</p>
            {pregnancyProgress ? (
              <PregnancyProgressBar
                progress={pregnancyProgress}
                dueLabel={daysUntilBirthLabel}
                className="mt-4"
              />
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="mb-4 text-sm text-muted-foreground">
          Укажите даты беременности в{" "}
          <Link href="/settings" className="font-medium text-primary hover:underline">
            настройках
          </Link>
          .
        </Card>
      )}

      <DailyProgressTracker status={dailyProgress} />

      <HomeQuickActions medicationLogs={medicationLogs} todayGlucoseLogs={todayGlucoseLogs} />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Последние показатели</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Сахар"
            value={lastGlucose ? `${Number(lastGlucose.value).toFixed(1)}` : "—"}
            hint={
              lastGlucose ? (lastGlucose.is_high ? "повышено" : "в норме") : "Сегодня нет записей"
            }
            hintVariant={lastGlucose ? (lastGlucose.is_high ? "warning" : "success") : undefined}
          />
          <StatCard
            label="Давление"
            value={lastBp ? `${lastBp.systolic}/${lastBp.diastolic}` : "—"}
            hint={
              lastBp
                ? isElevatedBloodPressure(lastBp.systolic, lastBp.diastolic)
                  ? "повышено"
                  : "в норме"
                : "Сегодня нет записей"
            }
            hintVariant={
              lastBp
                ? isElevatedBloodPressure(lastBp.systolic, lastBp.diastolic)
                  ? "warning"
                  : "success"
                : undefined
            }
          />
        </div>
      </section>

      <UpcomingNotificationsSection
        items={upcomingNotifications}
        notificationsEnabled={notificationsEnabled}
        hasActiveRules={hasActiveNotificationRules}
      />
    </PageContainer>
  );
}
