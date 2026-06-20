import { extractBackendError } from "@/lib/api/inventory";
import { parseResponseJson } from "@/lib/api/parse-response";
import type {
  BillingAccountSummary,
  BillingRenewCheckoutResponse,
  BillingTransactionsResponse,
} from "@/lib/types/billing-account-api";
import { isPaymentCheckoutContext } from "@/lib/types/auth-api";

function unwrapData<T>(body: unknown): T | null {
  const root =
    typeof body === "object" && body !== null ? (body as { data?: unknown; success?: boolean }) : null;
  if (root?.success === true && root.data !== undefined) {
    return root.data as T;
  }
  return null;
}

export async function fetchBillingAccount(
  organisationId: string,
): Promise<BillingAccountSummary> {
  const res = await fetch(
    `/api/billing/account?organisationId=${encodeURIComponent(organisationId)}`,
    { cache: "no-store" },
  );
  const body: unknown = await parseResponseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load subscription details");
  }
  const data = unwrapData<BillingAccountSummary>(body);
  if (!data) throw new Error("Invalid subscription response");
  return data;
}

export async function fetchBillingTransactions(
  organisationId: string,
  options?: { limit?: number; skip?: number },
): Promise<BillingTransactionsResponse> {
  const params = new URLSearchParams({ organisationId });
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.skip != null) params.set("skip", String(options.skip));

  const res = await fetch(`/api/billing/transactions?${params.toString()}`, {
    cache: "no-store",
  });
  const body: unknown = await parseResponseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load payment history");
  }
  const data = unwrapData<BillingTransactionsResponse>(body);
  if (!data) throw new Error("Invalid transactions response");
  return data;
}

export async function fetchRenewCheckout(
  organisationId: string,
): Promise<BillingRenewCheckoutResponse> {
  const res = await fetch(
    `/api/billing/renew-checkout?organisationId=${encodeURIComponent(organisationId)}`,
    { method: "POST", cache: "no-store" },
  );
  const body: unknown = await parseResponseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Could not start plan renewal");
  }
  const data = unwrapData<unknown>(body);
  if (!isPaymentCheckoutContext(data)) {
    throw new Error("Invalid renew checkout response");
  }
  return data;
}

export function formatBillingAmount(paise: number, currency = "INR"): string {
  if (paise <= 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export async function downloadBillingTransactionInvoice(
  organisationId: string,
  transactionId: string,
): Promise<void> {
  const res = await fetch(
    `/api/billing/transactions/${encodeURIComponent(transactionId)}/invoice?organisationId=${encodeURIComponent(organisationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    const body: unknown = await parseResponseJson(res);
    throw new Error(extractBackendError(body) ?? "Failed to download invoice");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? `Mahajaan-invoice-${transactionId}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatBillingDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function usagePercent(metric: { used: number; limit: number; unlimited: boolean }): number {
  if (metric.unlimited || metric.limit <= 0) return 0;
  return Math.min(100, Math.round((metric.used / metric.limit) * 100));
}

export function usageLabel(metric: { used: number; limit: number; unlimited: boolean }): string {
  if (metric.unlimited) return `${metric.used} / Unlimited`;
  if (metric.limit <= 0) return `${metric.used} / Not included`;
  return `${metric.used} / ${metric.limit}`;
}
