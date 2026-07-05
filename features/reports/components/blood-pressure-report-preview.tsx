import { ReportPageShell } from "@/features/reports/components/report-page-shell";
import { getReportTitle } from "@/features/reports/lib/report-kind";
import { formatBloodPressureValue, formatReportDateTime } from "@/features/reports/lib/report-formatters";
import type { ReportData } from "@/features/reports/lib/report-types";
import styles from "./doctor-report-preview.module.css";

interface BloodPressureReportPreviewProps {
  data: ReportData;
}

export function BloodPressureReportPreview({ data }: BloodPressureReportPreviewProps) {
  return (
    <ReportPageShell
      data={data}
      title={getReportTitle("blood-pressure")}
      reportPage="blood-pressure"
    >
      {data.bloodPressureLogs.length === 0 ? (
        <p className={styles.emptyLine}>Нет записей за период</p>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.colMd}>Дата</th>
              <th className={styles.colSm}>Давление</th>
              <th className={styles.colSm}>Пульс</th>
            </tr>
          </thead>
          <tbody>
            {data.bloodPressureLogs.map((log) => (
              <tr key={log.id} className={styles.tableRow}>
                <td>{formatReportDateTime(log.measured_at)}</td>
                <td>{formatBloodPressureValue(log.systolic, log.diastolic)}</td>
                <td>{log.pulse ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ReportPageShell>
  );
}
