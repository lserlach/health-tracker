import { GlucoseReportTable } from "@/features/reports/components/glucose-report-table";
import { ReportPageShell } from "@/features/reports/components/report-page-shell";
import { getReportTitle } from "@/features/reports/lib/report-kind";
import type { ReportData } from "@/features/reports/lib/report-types";
import styles from "./doctor-report-preview.module.css";

interface GlucoseReportPreviewProps {
  data: ReportData;
}

export function GlucoseReportPreview({ data }: GlucoseReportPreviewProps) {
  return (
    <ReportPageShell
      data={data}
      title={getReportTitle("glucose")}
      reportPage="glucose"
      orientation="landscape"
    >
      {data.glucoseLogs.length === 0 ? (
        <p className={styles.emptyLine}>Нет записей за период</p>
      ) : (
        <GlucoseReportTable logs={data.glucoseLogs} />
      )}
    </ReportPageShell>
  );
}
