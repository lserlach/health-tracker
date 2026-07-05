import { Document, Page, Text, View } from "@react-pdf/renderer";
import { getReportTitle } from "@/features/reports/lib/report-kind";
import {
  formatBloodPressureValue,
  formatReportDateTime,
  formatReportPeriodRange,
} from "@/features/reports/lib/report-formatters";
import type { ReportData } from "@/features/reports/lib/report-types";
import { registerReportFonts } from "./register-fonts";
import { reportPdfStyles as styles } from "./report-pdf-styles";

registerReportFonts();

interface BloodPressureReportDocumentProps {
  data: ReportData;
}

export function BloodPressureReportDocument({ data }: BloodPressureReportDocumentProps) {
  const periodRangeLabel = formatReportPeriodRange(data.dateFrom, data.dateTo);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{getReportTitle("blood-pressure")}</Text>
        <Text style={styles.subtitle}>{periodRangeLabel}</Text>

        {data.bloodPressureLogs.length === 0 ? (
          <Text>Нет записей за период</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.cellMd}>Дата</Text>
              <Text style={styles.cellSm}>Давление</Text>
              <Text style={styles.cellSm}>Пульс</Text>
            </View>
            {data.bloodPressureLogs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={styles.cellMd}>{formatReportDateTime(log.measured_at)}</Text>
                <Text style={styles.cellSm}>
                  {formatBloodPressureValue(log.systolic, log.diastolic)}
                </Text>
                <Text style={styles.cellSm}>{log.pulse ?? "—"}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.muted}>
          Сформировано {formatReportDateTime(data.generatedAt)} · Lurea
        </Text>
      </Page>
    </Document>
  );
}
