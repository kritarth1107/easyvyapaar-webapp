import {
  extractBackendError,
  normalizeCashBankSummary,
  normalizeCashBankTransactionsResponse,
} from "@/lib/api/cash-bank";
import type { CashBankListParams, CashBankSummary, CashBankTransactionsResponse } from "@/lib/types/cash-bank-api";

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

export async function fetchCashBankSummary(organisationId: string): Promise<CashBankSummary> {
  const res = await fetch(
    `/api/finance/cash-bank?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load cash & bank balances");
  return normalizeCashBankSummary(body);
}

export async function fetchCashBankTransactions(
  organisationId: string,
  params: CashBankListParams = {},
): Promise<CashBankTransactionsResponse> {
  const res = await fetch(
    `/api/finance/cash-bank/transactions?${buildQuery(organisationId, {
      accountId: params.accountId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load transactions");
  return normalizeCashBankTransactionsResponse(body);
}
