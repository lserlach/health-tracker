import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { getMeasurementTypeLabel } from "@/features/glucose/lib/validation";
import type { ReportData } from "@/features/reports/lib/report-types";
import { registerReportFonts } from "./register-fonts";

registerReportFonts();

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#1f2937",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 8,
  },
  summary: {
    backgroundColor: "#f5f3ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ede9fe",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cellSm: { width: "18%" },
  cellMd: { width: "24%" },
  cellLg: { width: "34%" },
  muted: { color: "#6b7280", fontSize: 9, marginTop: 12 },
});

function formatDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy, HH:mm", { locale: ru });
}

function formatDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: ru });
}

function medicationStatusLabel(status: ReportData["medicationRows"][number]["status"]) {
  switch (status) {
    case "taken":
      return "Принято";
    case "skipped":
      return "Пропущено";
    case "pending":
      return "Ожидает";
    case "missing":
      return "Не отмечено";
    default:
      return status;
  }
}

function buildSummary(data: ReportData) {
  const parts = [
    `Измерений сахара: ${data.glucoseStats.count}`,
    `Повышенных: ${data.glucoseStats.highCount}`,
    `Давление: ${data.bloodPressureLogs.length} записей`,
    `Вес: ${data.weightLogs.length} записей`,
  ];

  if (data.medicationAdherence != null) {
    parts.push(`Приём лекарств: ${data.medicationAdherence}%`);
  }

  return parts.join(" · ");
}

interface DoctorReportDocumentProps {
  data: ReportData;
}

export function DoctorReportDocument({ data }: DoctorReportDocumentProps) {
  const displayName = data.profile?.display_name || data.profile?.email || "Пациент";
  const pregnancyWeek = data.profile?.pregnancy_week
    ? `${data.profile.pregnancy_week} нед.`
    : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Отчёт для врача</Text>
        <Text style={styles.subtitle}>
          {displayName} · {data.periodLabel} · беременность {pregnancyWeek}
        </Text>

        <Text style={styles.sectionTitle}>Резюме</Text>
        <Text style={styles.summary}>{buildSummary(data)}</Text>

        <Text style={styles.sectionTitle}>Сахар крови</Text>
        {data.glucoseStats.count > 0 ? (
          <Text style={{ marginBottom: 8 }}>
            Среднее: {data.glucoseStats.avg} · Min: {data.glucoseStats.min} · Max:{" "}
            {data.glucoseStats.max} ммоль/л
          </Text>
        ) : (
          <Text style={{ marginBottom: 8 }}>Нет записей за период</Text>
        )}

        {data.glucoseLogs.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.cellMd}>Дата</Text>
              <Text style={styles.cellSm}>Тип</Text>
              <Text style={styles.cellSm}>Значение</Text>
              <Text style={styles.cellLg}>Еда / статус</Text>
            </View>
            {data.glucoseLogs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={styles.cellMd}>{formatDateTime(log.measured_at)}</Text>
                <Text style={styles.cellSm}>{getMeasurementTypeLabel(log.measurement_type)}</Text>
                <Text style={styles.cellSm}>{Number(log.value).toFixed(1)}</Text>
                <Text style={styles.cellLg}>
                  {log.measurement_type === "after_meal" && log.meal_text
                    ? `${log.meal_text}${log.minutes_after_meal ? ` (${log.minutes_after_meal} мин)` : ""}`
                    : log.is_high
                      ? "Повышено"
                      : "—"}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Артериальное давление</Text>
        {data.bloodPressureLogs.length === 0 ? (
          <Text>Нет записей за период</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.cellMd}>Дата</Text>
              <Text style={styles.cellSm}>Верхнее</Text>
              <Text style={styles.cellSm}>Нижнее</Text>
              <Text style={styles.cellSm}>Пульс</Text>
            </View>
            {data.bloodPressureLogs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={styles.cellMd}>{formatDateTime(log.measured_at)}</Text>
                <Text style={styles.cellSm}>{log.systolic}</Text>
                <Text style={styles.cellSm}>{log.diastolic}</Text>
                <Text style={styles.cellSm}>{log.pulse ?? "—"}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Вес</Text>
        {data.weightLogs.length === 0 ? (
          <Text>Нет записей за период</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.cellMd}>Дата</Text>
              <Text style={styles.cellSm}>Вес, кг</Text>
              <Text style={styles.cellMd}>Δ от старта</Text>
            </View>
            {data.weightLogs.map((log) => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={styles.cellMd}>{formatDateTime(log.measured_at)}</Text>
                <Text style={styles.cellSm}>{log.weight.toFixed(1)}</Text>
                <Text style={styles.cellMd}>
                  {log.deltaFromStart != null
                    ? `${log.deltaFromStart >= 0 ? "+" : ""}${log.deltaFromStart} кг`
                    : "—"}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.muted}>
          Сформировано {formatDateTime(data.generatedAt)} · Дневник здоровья
        </Text>
      </Page>

      {data.medicationRows.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Лекарства</Text>
          <Text style={styles.subtitle}>
            Приверженность: {data.medicationAdherence ?? 0}% · {data.periodLabel}
          </Text>

          <View style={styles.tableHeader}>
            <Text style={styles.cellSm}>Дата</Text>
            <Text style={styles.cellMd}>Лекарство</Text>
            <Text style={styles.cellSm}>Время</Text>
            <Text style={styles.cellSm}>Статус</Text>
          </View>
          {data.medicationRows.map((row, index) => (
            <View key={`${row.scheduledFor}-${index}`} style={styles.tableRow}>
              <Text style={styles.cellSm}>{formatDate(row.scheduledFor)}</Text>
              <Text style={styles.cellMd}>
                {row.medicationName} ({row.dosage})
              </Text>
              <Text style={styles.cellSm}>
                {format(parseISO(row.scheduledFor), "HH:mm", { locale: ru })}
              </Text>
              <Text style={styles.cellSm}>{medicationStatusLabel(row.status)}</Text>
            </View>
          ))}
        </Page>
      ) : null}
    </Document>
  );
}
