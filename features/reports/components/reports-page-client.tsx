"use client";

import { useState } from "react";
import { Drop, Heartbeat } from "@phosphor-icons/react";
import { fetchReportDataAction } from "@/features/reports/actions/fetch-report-data";
import { downloadReport } from "@/features/reports/lib/download-report";
import { hasReportData, REPORT_KIND_LABELS, type ReportKind } from "@/features/reports/lib/report-kind";
import {
  REPORT_PERIOD_OPTIONS,
  type ReportPeriod,
} from "@/features/reports/lib/report-periods";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";

const REPORT_DOWNLOADS: Array<{
  kind: ReportKind;
  icon: typeof Drop;
  description: string;
}> = [
  {
    kind: "glucose",
    icon: Drop,
    description: "Натощак и после еды за выбранный период.",
  },
  {
    kind: "blood-pressure",
    icon: Heartbeat,
    description: "Давление и пульс за выбранный период.",
  },
];

export function ReportsPageClient() {
  const [period, setPeriod] = useState<ReportPeriod>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loadingKind, setLoadingKind] = useState<ReportKind | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  async function handleDownload(kind: ReportKind) {
    if (period === "custom" && (!customFrom || !customTo)) {
      setToast({ message: "Укажите даты периода", variant: "error" });
      return;
    }

    setLoadingKind(kind);
    try {
      const result = await fetchReportDataAction({ period, customFrom, customTo });
      if (result.error || !result.data) {
        setToast({ message: result.error ?? "Не удалось загрузить данные", variant: "error" });
        return;
      }

      if (!hasReportData(result.data, kind)) {
        setToast({
          message: `За выбранный период нет данных: ${REPORT_KIND_LABELS[kind].toLowerCase()}`,
          variant: "error",
        });
        return;
      }

      await downloadReport(result.data, kind);
      setToast({ message: "PDF сохранён", variant: "success" });
    } catch {
      setToast({ message: "Не удалось создать PDF", variant: "error" });
    } finally {
      setLoadingKind(null);
    }
  }

  return (
    <PageContainer>
      <AppHeader title="Отчёты" />

      <Card flat className="space-y-4">
        <div>
          <p className="font-heading font-medium text-foreground">PDF для врача</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Два отдельных отчёта за выбранный период: сахар и давление.
          </p>
        </div>

        <Select
          label="Период"
          value={period}
          onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
          options={REPORT_PERIOD_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
        />

        {period === "custom" ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="С"
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
            <Input
              label="По"
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </div>
        ) : null}

        <div className="grid gap-3">
          {REPORT_DOWNLOADS.map(({ kind, icon: Icon, description }) => (
            <div
              key={kind}
              className="rounded-(--radius-button) border border-border bg-background px-4 py-3"
            >
              <p className="font-heading font-medium text-foreground">{REPORT_KIND_LABELS[kind]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <Button
                className="mt-3 w-full"
                disabled={loadingKind !== null}
                onClick={() => void handleDownload(kind)}
              >
                <Icon size={20} weight="bold" />
                {loadingKind === kind ? "Формируем..." : "Скачать PDF"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
