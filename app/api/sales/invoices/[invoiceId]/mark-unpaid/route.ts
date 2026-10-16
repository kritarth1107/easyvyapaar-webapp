import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

type RouteContext = { params: Promise<{ invoiceId: string }> };

/** Reverses receipts; voucher allocations are released back to the party as advance. */
export async function POST(request: Request, context: RouteContext) {
  const { invoiceId } = await context.params;
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: `invoices/${encodeURIComponent(invoiceId.trim())}/mark-unpaid`,
    errorMessage: "Failed to mark invoice unpaid",
  });
}
