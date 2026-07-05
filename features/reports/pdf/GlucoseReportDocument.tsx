import { Document, Page, Text, View } from "@react-pdf/renderer";
import { GLUCOSE_REPORT_SECTIONS } from "@/features/glucose/lib/meal-slots";
import {
  GLUCOSE_REPORT_FOOD_HEADERS,
  GLUCOSE_REPORT_SUGAR_HEADERS,
  formatGlucoseReportFoodCell,
  formatGlucoseReportSugarCell,
  getGlucoseReportSugarLog,
  groupGlucoseLogsByDay,
} from "@/features/reports/lib/group-glucose-report-rows";
import { getReportTitle } from "@/features/reports/lib/report-kind";
import {
  formatReportDateTime,
  formatReportDayDateCompact,
  formatReportPeriodRange,
} from "@/features/reports/lib/report-formatters";
import type { ReportData } from "@/features/reports/lib/report-types";
import { registerReportFonts } from "./register-fonts";
import { reportPdfStyles as styles } from "./report-pdf-styles";

registerReportFonts();

interface GlucoseReportDocumentProps {
  data: ReportData;
}

export function GlucoseReportDocument({ data }: GlucoseReportDocumentProps) {
  const periodRangeLabel = formatReportPeriodRange(data.dateFrom, data.dateTo);
  const rows = groupGlucoseLogsByDay(data.glucoseLogs);

  return (
    <Document>
      <Page size="A4" style={styles.pageLandscape} orientation="landscape">
        <Text style={styles.titleLandscape}>{getReportTitle("glucose")}</Text>
        <Text style={styles.subtitleLandscape}>{periodRangeLabel}</Text>

        {rows.length === 0 ? (
          <Text>Нет записей за период</Text>
        ) : (
          <>
            <View style={styles.tableHeaderGroup}>
              <Text style={styles.cellDateLandscape}>Дата</Text>
              <Text style={styles.tableGroupTitleSugarLandscape}>
                {GLUCOSE_REPORT_SECTIONS.selfMonitoring}
              </Text>
              <Text style={styles.tableGroupTitleFoodLandscape}>
                {GLUCOSE_REPORT_SECTIONS.nutrition}
              </Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={styles.cellDateLandscape} />
              {GLUCOSE_REPORT_SUGAR_HEADERS.map((column) => (
                <Text key={`sugar-${column.key}`} style={styles.cellSugarHeaderLandscape}>
                  {column.label}
                </Text>
              ))}
              {GLUCOSE_REPORT_FOOD_HEADERS.map((column) => (
                <Text key={`food-${column.key}`} style={styles.cellFoodLandscape}>
                  {column.label}
                </Text>
              ))}
            </View>

            {rows.map((row) => (
              <View key={row.dateKey} style={styles.tableRow}>
                <Text style={styles.cellDateLandscape}>
                  {formatReportDayDateCompact(row.dateKey)}
                </Text>

                {GLUCOSE_REPORT_SUGAR_HEADERS.map((column) => {
                  const log = getGlucoseReportSugarLog(row, column.key);

                  return (
                    <Text
                      key={`${row.dateKey}-sugar-${column.key}`}
                      style={
                        log?.is_high
                          ? [styles.cellSugarLandscape, styles.glucoseHigh]
                          : styles.cellSugarLandscape
                      }
                    >
                      {formatGlucoseReportSugarCell(log)}
                    </Text>
                  );
                })}

                {GLUCOSE_REPORT_FOOD_HEADERS.map((column) => (
                  <Text key={`${row.dateKey}-food-${column.key}`} style={styles.cellFoodLandscape}>
                    {formatGlucoseReportFoodCell(row.mealFood[column.key])}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        <Text style={styles.mutedLandscape}>
          Сформировано {formatReportDateTime(data.generatedAt)} · Lurea
        </Text>
      </Page>
    </Document>
  );
}
