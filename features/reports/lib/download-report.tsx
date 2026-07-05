"use client";

import { createElement } from "react";
import type { ReportKind } from "@/features/reports/lib/report-kind";
import { getReportDownloadFilename } from "@/features/reports/lib/report-kind";
import type { ReportData } from "@/features/reports/lib/report-types";

export async function downloadReport(data: ReportData, kind: ReportKind) {
  const [{ pdf }, documentModule] = await Promise.all([
    import("@react-pdf/renderer"),
    kind === "glucose"
      ? import("@/features/reports/pdf/GlucoseReportDocument")
      : import("@/features/reports/pdf/BloodPressureReportDocument"),
  ]);

  const DocumentComponent =
    kind === "glucose"
      ? documentModule.GlucoseReportDocument
      : documentModule.BloodPressureReportDocument;

  const blob = await pdf(createElement(DocumentComponent, { data }) as never).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = getReportDownloadFilename(kind, data.dateTo);
  link.click();
  URL.revokeObjectURL(url);
}
