"use client";

import { createElement } from "react";
import type { ReportKind } from "@/features/reports/lib/report-kind";
import { getReportDownloadFilename } from "@/features/reports/lib/report-kind";
import type { ReportData } from "@/features/reports/lib/report-types";

export async function downloadReport(data: ReportData, kind: ReportKind) {
  const { pdf } = await import("@react-pdf/renderer");
  let blob: Blob;

  if (kind === "glucose") {
    const { GlucoseReportDocument } = await import("@/features/reports/pdf/GlucoseReportDocument");
    blob = await pdf(createElement(GlucoseReportDocument, { data }) as never).toBlob();
  } else {
    const { BloodPressureReportDocument } = await import(
      "@/features/reports/pdf/BloodPressureReportDocument"
    );
    blob = await pdf(createElement(BloodPressureReportDocument, { data }) as never).toBlob();
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = getReportDownloadFilename(kind, data.dateTo);
  link.click();
  URL.revokeObjectURL(url);
}
