import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

type RouteContext = { params: Promise<{ proformaId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { proformaId } = await context.params;
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: `proformas/${encodeURIComponent(proformaId.trim())}/convert`,
    errorMessage: "Failed to convert proforma invoice",
  });
}
