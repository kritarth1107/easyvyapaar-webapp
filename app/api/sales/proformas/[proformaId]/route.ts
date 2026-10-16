import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

type RouteContext = { params: Promise<{ proformaId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { proformaId } = await context.params;
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: `proformas/${encodeURIComponent(proformaId.trim())}`,
    errorMessage: "Failed to load proforma invoice",
  });
}

/** Partial body; status may be draft, sent or cancelled. */
export async function PATCH(request: Request, context: RouteContext) {
  const { proformaId } = await context.params;
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: `proformas/${encodeURIComponent(proformaId.trim())}`,
    errorMessage: "Failed to update proforma invoice",
  });
}

/** Soft delete (backend refuses converted proformas). */
export async function DELETE(request: Request, context: RouteContext) {
  const { proformaId } = await context.params;
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: `proformas/${encodeURIComponent(proformaId.trim())}`,
    errorMessage: "Failed to delete proforma invoice",
  });
}
