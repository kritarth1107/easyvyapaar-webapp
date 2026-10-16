import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

export async function GET(request: Request) {
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: "proformas/next-number",
    errorMessage: "Failed to load proforma number",
  });
}
