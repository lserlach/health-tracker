import { ReportPreviewPageClient } from "@/features/reports/components/report-preview-page-client";
import { getSampleReportData } from "@/features/reports/lib/sample-report-data";

export default function ReportPreviewPage() {
  return <ReportPreviewPageClient data={getSampleReportData()} />;
}
