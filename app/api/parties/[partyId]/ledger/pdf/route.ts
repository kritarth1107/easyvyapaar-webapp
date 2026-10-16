import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ partyId: string }> };

/** Party ledger statement PDF for ?from&to (both optional). */
export async function GET(request: Request, context: RouteContext) {
  const { partyId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `parties/organisations/${encodeURIComponent(orgId)}/parties/${encodeURIComponent(partyId.trim())}/ledger/pdf`,
    { errorMessage: "Failed to load party ledger PDF", fallbackFilename: "party-ledger.pdf", queryKeys: ["from", "to"] },
  );
}
