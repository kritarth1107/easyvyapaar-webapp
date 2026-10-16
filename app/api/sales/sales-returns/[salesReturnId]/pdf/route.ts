import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ salesReturnId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { salesReturnId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `sales/organisations/${encodeURIComponent(orgId)}/sales-returns/${encodeURIComponent(salesReturnId.trim())}/pdf`,
    { errorMessage: "Failed to load sales return PDF", fallbackFilename: "sales-return.pdf" },
  );
}
