import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ deliveryChallanId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { deliveryChallanId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `sales/organisations/${encodeURIComponent(orgId)}/delivery-challans/${encodeURIComponent(deliveryChallanId.trim())}/pdf`,
    { errorMessage: "Failed to load delivery challan PDF", fallbackFilename: "delivery-challan.pdf" },
  );
}
