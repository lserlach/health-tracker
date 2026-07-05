import { NextResponse } from "next/server";
import {
  getReportDownloadFilename,
  type ReportKind,
} from "@/features/reports/lib/report-kind";
import { getSampleReportData } from "@/features/reports/lib/sample-report-data";
import { renderReportPdf } from "@/features/reports/pdf/render-report-pdf";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helpers";

function parseReportKind(value: string | null): ReportKind {
  return value === "blood-pressure" ? "blood-pressure" : "glucose";
}

export async function GET(request: Request) {
  const { user, error } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = parseReportKind(url.searchParams.get("type"));
  const download = url.searchParams.get("download") === "1";

  try {
    const data = getSampleReportData();
    const buffer = await renderReportPdf(data, kind);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          download ? "attachment" : "inline"
        }; filename="${getReportDownloadFilename(kind, data.dateTo)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (renderError) {
    console.error("Failed to render test PDF", renderError);
    return NextResponse.json({ error: "Failed to render PDF" }, { status: 500 });
  }
}
