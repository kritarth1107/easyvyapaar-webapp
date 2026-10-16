import { forwardOrganisationRequest } from "@/lib/api/passthrough-route";

export async function GET(request: Request) {
  return forwardOrganisationRequest(request, {
    scope: "reports",
    path: "audit-logs",
    queryKeys: [
      "entityType",
      "entityId",
      "action",
      "actorUserId",
      "fromDate",
      "toDate",
      "includeSnapshots",
      "page",
      "limit",
    ],
    errorMessage: "Failed to load audit log",
  });
}
