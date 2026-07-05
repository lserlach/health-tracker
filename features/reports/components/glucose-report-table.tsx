import {
  GLUCOSE_REPORT_FOOD_HEADERS,
  GLUCOSE_REPORT_SUGAR_HEADERS,
  formatGlucoseReportFoodCell,
  formatGlucoseReportSugarCell,
  getGlucoseReportSugarLog,
  groupGlucoseLogsByDay,
} from "@/features/reports/lib/group-glucose-report-rows";
import { GLUCOSE_REPORT_SECTIONS } from "@/features/glucose/lib/meal-slots";
import { formatReportDayDateCompact } from "@/features/reports/lib/report-formatters";
import type { GlucoseLog } from "@/types/database.types";
import styles from "./doctor-report-preview.module.css";

interface GlucoseReportTableProps {
  logs: GlucoseLog[];
}

export function GlucoseReportTable({ logs }: GlucoseReportTableProps) {
  const rows = groupGlucoseLogsByDay(logs);

  return (
    <table className={`${styles.table} ${styles.tableGlucoseLandscape}`}>
      <thead className={styles.tableHead}>
        <tr>
          <th className={styles.colDateGlucose} rowSpan={2}>
            Дата
          </th>
          <th className={styles.tableGroupTitle} colSpan={GLUCOSE_REPORT_SUGAR_HEADERS.length}>
            {GLUCOSE_REPORT_SECTIONS.selfMonitoring}
          </th>
          <th className={styles.tableGroupTitle} colSpan={GLUCOSE_REPORT_FOOD_HEADERS.length}>
            {GLUCOSE_REPORT_SECTIONS.nutrition}
          </th>
        </tr>
        <tr>
          {GLUCOSE_REPORT_SUGAR_HEADERS.map((column) => (
            <th key={`sugar-${column.key}`} className={styles.colSugarHeader}>
              {column.label}
            </th>
          ))}
          {GLUCOSE_REPORT_FOOD_HEADERS.map((column) => (
            <th key={`food-${column.key}`} className={styles.colFood}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.dateKey} className={styles.tableRow}>
            <td className={styles.colDateGlucose}>{formatReportDayDateCompact(row.dateKey)}</td>

            {GLUCOSE_REPORT_SUGAR_HEADERS.map((column) => {
              const log = getGlucoseReportSugarLog(row, column.key);
              const isHigh = log?.is_high ?? false;

              return (
                <td
                  key={`${row.dateKey}-sugar-${column.key}`}
                  className={`${styles.colSugarCell}${isHigh ? ` ${styles.glucoseHigh}` : ""}`}
                >
                  {formatGlucoseReportSugarCell(log)}
                </td>
              );
            })}

            {GLUCOSE_REPORT_FOOD_HEADERS.map((column) => (
              <td key={`${row.dateKey}-food-${column.key}`} className={styles.foodCell}>
                {formatGlucoseReportFoodCell(row.mealFood[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
