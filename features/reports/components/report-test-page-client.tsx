"use client";

import Link from "next/link";
import { ArrowLeft, Eye, FilePdf } from "@phosphor-icons/react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const previewUrl = "/reports/test/preview";
const glucosePdfUrl = "/api/reports/test-pdf?download=1&type=glucose";
const bloodPressurePdfUrl = "/api/reports/test-pdf?download=1&type=blood-pressure";

export function ReportTestPageClient() {
  return (
    <PageContainer>
      <AppHeader
        title="Тестовый отчёт"
        actions={
          <Link
            href="/reports"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Назад к отчётам"
          >
            <ArrowLeft size={22} />
          </Link>
        }
      />

      <Card flat className="space-y-4">
        <div>
          <p className="font-heading font-medium text-foreground">Шаблон отчёта для врача</p>
          <p className="mt-1 text-sm text-muted-foreground">
            HTML-превью на весь экран в формате A4 (210×297 мм) для Design в Cursor. PDF — только
            для финальной проверки.
          </p>
        </div>

        <div className="rounded-(--radius-button) bg-primary-soft/45 px-3 py-2.5 text-sm text-muted-foreground">
          Редактируйте{" "}
          <code className="text-xs">features/reports/components/glucose-report-preview.tsx</code>,{" "}
          <code className="text-xs">blood-pressure-report-preview.tsx</code> и{" "}
          <code className="text-xs">doctor-report-preview.module.css</code>. Тестовые данные — в{" "}
          <code className="text-xs">features/reports/lib/sample-report-data.ts</code>.
        </div>

        <div className="grid gap-3">
          <Link
            href={previewUrl}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-(--radius-button) bg-primary px-6 text-base font-medium text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            <Eye size={20} weight="bold" />
            Открыть HTML-превью для Design
          </Link>

          <a
            href={glucosePdfUrl}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-(--radius-button) border border-border bg-primary-soft px-6 text-base font-medium text-foreground transition-colors hover:bg-primary-soft/80"
          >
            <FilePdf size={20} weight="bold" />
            Скачать тестовый PDF: сахар
          </a>

          <a
            href={bloodPressurePdfUrl}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-(--radius-button) border border-border bg-primary-soft px-6 text-base font-medium text-foreground transition-colors hover:bg-primary-soft/80"
          >
            <FilePdf size={20} weight="bold" />
            Скачать тестовый PDF: давление
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Ссылка для Design:{" "}
          <Link href={previewUrl} className="font-medium text-primary hover:underline">
            /reports/test/preview
          </Link>
        </p>
      </Card>
    </PageContainer>
  );
}
