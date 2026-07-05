import type { ReactNode } from "react";
import { formatReportDateTime, formatReportPeriodRange } from "@/features/reports/lib/report-formatters";
import type { ReportData } from "@/features/reports/lib/report-types";
import styles from "./doctor-report-preview.module.css";

interface ReportPageShellProps {
  data: ReportData;
  title: string;
  reportPage: string;
  orientation?: "portrait" | "landscape";
  children: ReactNode;
}

export function ReportPageShell({
  data,
  title,
  reportPage,
  orientation = "portrait",
  children,
}: ReportPageShellProps) {
  const periodRangeLabel = formatReportPeriodRange(data.dateFrom, data.dateTo);
  const pageClassName =
    orientation === "landscape" ? `${styles.page} ${styles.pageLandscape}` : styles.page;

  return (
    <article className={pageClassName} data-report-page={reportPage}>
      <header>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{periodRangeLabel}</p>
      </header>

      {children}

      <footer className={styles.footer}>
        Сформировано {formatReportDateTime(data.generatedAt)} · Lurea
      </footer>
    </article>
  );
}
