"use client";

import { useState } from "react";
import { FilePdf } from "@phosphor-icons/react";
import { fetchReportDataAction } from "@/features/reports/actions/fetch-report-data";
import { downloadDoctorReport } from "@/features/reports/lib/download-doctor-report";
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

export function ReportsPageClient() {
  const [period, setPeriod] = useState<ReportPeriod>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  async function handleDownload() {
    if (period === "custom" && (!customFrom || !customTo)) {
      setToast({ message: "Укажите даты периода", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const result = await fetchReportDataAction({ period, customFrom, customTo });
      if (result.error || !result.data) {
        setToast({ message: result.error ?? "Не удалось загрузить данные", variant: "error" });
        return;
      }

      const totalRecords =
        result.data.glucoseLogs.length +
        result.data.bloodPressureLogs.length +
        result.data.weightLogs.length;

      if (totalRecords === 0 && result.data.medicationRows.length === 0) {
        setToast({ message: "За выбранный период нет данных", variant: "error" });
        return;
      }

      await downloadDoctorReport(result.data);
      setToast({ message: "PDF сохранён", variant: "success" });
    } catch {
      setToast({ message: "Не удалось создать PDF", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <AppHeader title="Отчёты" />

      <Card flat className="space-y-4">
        <div>
          <p className="font-heading font-medium text-foreground">PDF для врача</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Сахар, давление, вес и приём лекарств за выбранный период.
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

        <Button className="w-full" disabled={loading} onClick={() => void handleDownload()}>
          <FilePdf size={20} weight="bold" />
          {loading ? "Формируем..." : "Скачать PDF"}
        </Button>
      </Card>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
