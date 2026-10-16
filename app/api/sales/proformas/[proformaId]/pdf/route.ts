import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ proformaId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { proformaId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `sales/organisations/${encodeURIComponent(orgId)}/proformas/${encodeURIComponent(proformaId.trim())}/pdf`,
    { errorMessage: "Failed to load proforma invoice PDF", fallbackFilename: "proforma.pdf" },
  );
}
