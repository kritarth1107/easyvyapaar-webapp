import { extractBackendError } from "@/lib/api/inventory";
import { isParsedReport, normalizeReportData, parseReportData } from "@/lib/reports/parse-report";
import type { ReportData, ReportSlug } from "@/lib/types/reports-api";

export { extractBackendError, isParsedReport, normalizeReportData, parseReportData };

export function extractReportFromResponse(body: unknown, reportType: ReportSlug): ReportData {
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  if (root?.data && isParsedReport(root.data)) {
    return root.data;
  }
  return parseReportData(body, reportType);
}
