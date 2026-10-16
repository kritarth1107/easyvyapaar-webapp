import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ quotationId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { quotationId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `sales/organisations/${encodeURIComponent(orgId)}/quotations/${encodeURIComponent(quotationId.trim())}/pdf`,
    { errorMessage: "Failed to load quotation PDF", fallbackFilename: "quotation.pdf" },
  );
}
