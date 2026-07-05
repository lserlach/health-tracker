export type ReportKind = "glucose" | "blood-pressure";

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  glucose: "Сахар крови",
  "blood-pressure": "Артериальное давление",
};

export function getReportTitle(kind: ReportKind) {
  return kind === "glucose" ? "Отчёт: сахар крови" : "Отчёт: артериальное давление";
}

export function getReportDownloadFilename(kind: ReportKind, dateTo: string) {
  const datePart = new Date(dateTo).toISOString().slice(0, 10);
  const slug = kind === "glucose" ? "glucose" : "blood-pressure";
  return `lurea-${slug}-report-${datePart}.pdf`;
}

export function hasReportData(data: {
  glucoseLogs: unknown[];
  bloodPressureLogs: unknown[];
}, kind: ReportKind) {
  return kind === "glucose" ? data.glucoseLogs.length > 0 : data.bloodPressureLogs.length > 0;
}
