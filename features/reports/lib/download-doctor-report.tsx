"use client";

import { createElement } from "react";
import type { ReportData } from "@/features/reports/lib/report-types";

export async function downloadDoctorReport(data: ReportData) {
  const [{ pdf }, { DoctorReportDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/features/reports/pdf/DoctorReportDocument"),
  ]);

  const blob = await pdf(
    createElement(DoctorReportDocument, { data }) as never,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePart = new Date(data.dateTo).toISOString().slice(0, 10);

  link.href = url;
  link.download = `health-report-${datePart}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
