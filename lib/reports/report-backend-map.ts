import type { ReportSlug } from "@/lib/types/reports-api";

/** Frontend slug → backend path segment under /reports/organisations/:id/ */
const BACKEND_PATH_OVERRIDES: Partial<Record<ReportSlug, string>> = {
  "expense-categories": "expense-by-category",
  "party-report-by-item": "party-by-item",
  "sales-category-wise": "sales-by-category",
};

export function resolveBackendReportPath(reportType: ReportSlug): string {
  return BACKEND_PATH_OVERRIDES[reportType] ?? reportType;
}

/** Reports that use `asOfDate` instead of a date range. */
export const AS_OF_DATE_REPORTS: ReportSlug[] = [
  "balance-sheet",
  "receivable-ageing",
  "payable-ageing",
];

export function getDefaultReportDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  return { fromDate: from.toISOString().slice(0, 10), toDate };
}
