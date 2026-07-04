"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { Drop, Heartbeat, Pill, Plus, Scales, WarningCircle } from "@phosphor-icons/react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils/cn";
import type { BloodPressureLog, GlucoseLog, WeightLog } from "@/types/database.types";

const quickActions = [
  { href: "/glucose", label: "Сахар", icon: Drop },
  { href: "/glucose", label: "После еды", icon: Plus },
  { href: "/medications", label: "Лекарство", icon: Pill },
  { href: "/blood-pressure", label: "Давление", icon: Heartbeat },
  { href: "/weight", label: "Вес", icon: Scales },
] as const;

const quickActionClassName = cn(
  "flex h-auto min-h-[5.5rem] w-full flex-col items-center justify-center gap-2 rounded-(--radius-button) border border-border bg-primary-soft px-4 py-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft/80",
);

interface HomePageClientProps {
  lastGlucose: GlucoseLog | null;
  hasHighGlucoseToday: boolean;
  lastBp: BloodPressureLog | null;
  lastWeight: WeightLog | null;
  medicationTaken: number;
  medicationTotal: number;
  pregnancyWeek: number | null;
  daysUntilDue: number | null;
  dueDate: string | null;
}

function formatDueLabel(daysUntilDue: number | null, dueDate: string | null) {
  if (daysUntilDue == null || !dueDate) return null;
  const formattedDate = format(parseISO(dueDate), "d MMMM yyyy", { locale: ru });

  if (daysUntilDue < 0) {
    return `ПДР была ${Math.abs(daysUntilDue)} дн. назад (${formattedDate})`;
  }
  if (daysUntilDue === 0) {
    return `ПДР сегодня · ${formattedDate}`;
  }
  return `До ПДР: ${daysUntilDue} дн. · ${formattedDate}`;
}

export function HomePageClient({
  lastGlucose,
  hasHighGlucoseToday,
  lastBp,
  lastWeight,
  medicationTaken,
  medicationTotal,
  pregnancyWeek,
  daysUntilDue,
  dueDate,
}: HomePageClientProps) {
  const todos: string[] = [];

  if (!lastGlucose) {
    todos.push("Измерить сахар натощак");
  }
  if (!lastWeight) {
    todos.push("Внести вес утром");
  }
  if (medicationTotal > 0 && medicationTaken < medicationTotal) {
    todos.push(`Принять лекарства (${medicationTaken}/${medicationTotal})`);
  }

  return (
    <PageContainer>
      <AppHeader title="Сегодня" showActions />

      {pregnancyWeek != null ? (
        <Card className="mb-4 bg-primary-soft/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Беременность</p>
              <p className="text-2xl font-semibold">{pregnancyWeek} неделя</p>
              {formatDueLabel(daysUntilDue, dueDate) ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDueLabel(daysUntilDue, dueDate)}
                </p>
              ) : null}
            </div>
            <Link
              href="/settings"
              className="text-sm font-medium text-primary hover:underline"
            >
              Настройки
            </Link>
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

      {hasHighGlucoseToday ? (
        <Card className="mb-4 flex items-center gap-3 border-warning bg-warning/20">
          <WarningCircle size={22} className="text-warning-foreground" />
          <p className="text-sm text-warning-foreground">
            Сегодня были повышенные значения сахара
          </p>
        </Card>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href} className={quickActionClassName}>
              <Icon size={24} weight="regular" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          label="Последний сахар"
          value={lastGlucose ? `${Number(lastGlucose.value).toFixed(1)}` : "—"}
          hint={lastGlucose ? (lastGlucose.is_high ? "повышено" : "ммоль/л") : "Сегодня нет записей"}
        />
        <StatCard
          label="Давление"
          value={lastBp ? `${lastBp.systolic}/${lastBp.diastolic}` : "—"}
        />
        <StatCard
          label="Вес"
          value={lastWeight ? `${Number(lastWeight.weight).toFixed(1)} кг` : "—"}
        />
        <StatCard
          label="Лекарства"
          value={medicationTotal > 0 ? `${medicationTaken}/${medicationTotal}` : "—"}
          hint={medicationTotal > 0 ? "принято сегодня" : "Не добавлены"}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Что нужно сделать сегодня
        </h2>
        {todos.length === 0 ? (
          <Card className="text-sm text-muted-foreground">
            На сегодня базовые напоминания выполнены.
          </Card>
        ) : (
          <div className="space-y-2">
            {todos.map((item) => (
              <Card key={item} className="flex items-center justify-between gap-3">
                <span className="text-sm">{item}</span>
                <Badge variant="muted">Напоминание</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
