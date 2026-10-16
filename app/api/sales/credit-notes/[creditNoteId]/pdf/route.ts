import { proxyBackendPdf } from "@/lib/api/pdf-proxy";

type RouteContext = { params: Promise<{ creditNoteId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { creditNoteId } = await context.params;
  return proxyBackendPdf(
    request,
    (orgId) => `sales/organisations/${encodeURIComponent(orgId)}/credit-notes/${encodeURIComponent(creditNoteId.trim())}/pdf`,
    { errorMessage: "Failed to load credit note PDF", fallbackFilename: "credit-note.pdf" },
  );
}
