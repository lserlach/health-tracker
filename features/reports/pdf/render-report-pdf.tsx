import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ReportKind } from "@/features/reports/lib/report-kind";
import type { ReportData } from "@/features/reports/lib/report-types";
import { BloodPressureReportDocument } from "@/features/reports/pdf/BloodPressureReportDocument";
import { GlucoseReportDocument } from "@/features/reports/pdf/GlucoseReportDocument";

export async function renderReportPdf(data: ReportData, kind: ReportKind) {
  const DocumentComponent =
    kind === "glucose" ? GlucoseReportDocument : BloodPressureReportDocument;

  return renderToBuffer(createElement(DocumentComponent, { data }) as never);
}
