import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ paymentId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { paymentId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `finance/organisations/${encodeURIComponent(orgId)}/payments/${encodeURIComponent(paymentId.trim())}/pdf`,
    { errorMessage: "Failed to load payment receipt PDF", fallbackFilename: "payment.pdf" },
  );
}
