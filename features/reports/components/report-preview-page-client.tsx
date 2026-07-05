"use client";

import Link from "next/link";
import { ArrowLeft, FilePdf } from "@phosphor-icons/react";
import { BloodPressureReportPreview } from "@/features/reports/components/blood-pressure-report-preview";
import { GlucoseReportPreview } from "@/features/reports/components/glucose-report-preview";
import type { ReportData } from "@/features/reports/lib/report-types";
import styles from "./doctor-report-preview.module.css";
import previewStyles from "./report-preview-page-client.module.css";

interface ReportPreviewPageClientProps {
  data: ReportData;
}

export function ReportPreviewPageClient({ data }: ReportPreviewPageClientProps) {
  return (
    <div className={previewStyles.root}>
      <header className={previewStyles.toolbar}>
        <div className={previewStyles.toolbarInner}>
          <Link href="/reports/test" className={previewStyles.toolbarLink}>
            <ArrowLeft size={18} />
            Настройки шаблона
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="/api/reports/test-pdf?download=1&type=glucose"
              className={previewStyles.toolbarLinkMuted}
            >
              <FilePdf size={16} />
              PDF: сахар
            </a>
            <a
              href="/api/reports/test-pdf?download=1&type=blood-pressure"
              className={previewStyles.toolbarLinkMuted}
            >
              <FilePdf size={16} />
              PDF: давление
            </a>
          </div>
        </div>
      </header>

      <main className={previewStyles.main}>
        <div className={styles.canvas} data-report-preview>
          <GlucoseReportPreview data={data} />
          <BloodPressureReportPreview data={data} />
        </div>
      </main>
    </div>
  );
}
