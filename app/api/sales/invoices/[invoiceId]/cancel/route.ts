import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

type RouteContext = { params: Promise<{ invoiceId: string }> };

/** Body { reason?: string }. 422 "Cancel the e-Invoice (IRN) first" while an IRN is active. */
export async function POST(request: Request, context: RouteContext) {
  const { invoiceId } = await context.params;
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: `invoices/${encodeURIComponent(invoiceId.trim())}/cancel`,
    errorMessage: "Failed to cancel invoice",
  });
}
