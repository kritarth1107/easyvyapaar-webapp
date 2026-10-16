import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

export async function GET(request: Request) {
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: "proformas",
    queryKeys: ["status", "search", "page", "limit"],
    errorMessage: "Failed to load proforma invoices",
  });
}

export async function POST(request: Request) {
  return forwardOrganisationRequest(request, {
    scope: "sales",
    path: "proformas",
    errorMessage: "Failed to create proforma invoice",
  });
}
