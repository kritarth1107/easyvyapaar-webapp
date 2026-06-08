import { extractBackendError, extractReportFromResponse } from "@/lib/api/reports";
import type { PartyStatementParams, ReportData, ReportFetchParams, ReportSlug } from "@/lib/types/reports-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildQuery(organisationId: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim()) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export async function fetchReport(
  organisationId: string,
  reportType: ReportSlug,
  params: ReportFetchParams = {},
): Promise<ReportData> {
  const res = await fetch(
    `/api/reports/${encodeURIComponent(reportType)}?${buildQuery(organisationId, {
      fromDate: params.fromDate,
      toDate: params.toDate,
      partyId: params.partyId,
      itemId: params.itemId,
      categoryId: params.categoryId,
      search: params.search,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load report");
  return extractReportFromResponse(body, reportType);
}

export async function fetchPartyStatement(
  organisationId: string,
  params: PartyStatementParams,
): Promise<ReportData> {
  const res = await fetch(
    `/api/reports/parties/${encodeURIComponent(params.partyId)}/statement?${buildQuery(organisationId, {
      fromDate: params.fromDate,
      toDate: params.toDate,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load party statement");
  return extractReportFromResponse(body, "party-outstanding");
}

export const REPORT_SLUGS: ReportSlug[] = [
  "gstr1",
  "gstr2",
  "gstr3b",
  "gst-sales-hsn",
  "gst-purchase-hsn",
  "hsn-wise-sales",
  "sales-summary",
  "purchase-summary",
  "profit-and-loss",
  "balance-sheet",
  "cash-bank",
  "daybook",
  "party-outstanding",
  "receivable-ageing",
  "payable-ageing",
  "stock-detail",
  "low-stock",
  "item-sales-purchase",
  "expense-categories",
  "bill-wise-profit",
  "party-report-by-item",
  "sales-category-wise",
];

export function isReportSlug(value: string): value is ReportSlug {
  return REPORT_SLUGS.includes(value as ReportSlug);
}
