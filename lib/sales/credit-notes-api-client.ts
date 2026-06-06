import {
  extractBackendError,
  normalizeCreditNoteDetailResponse,
  normalizeCreditNoteListResponse,
  normalizeNextCreditNoteNumber,
} from "@/lib/api/credit-notes";
import type {
  CreateCreditNoteRequest,
  CreditNoteDetail,
  CreditNoteListParams,
  CreditNoteListResponse,
  CreditNoteType,
  NextCreditNoteNumber,
} from "@/lib/types/credit-notes-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: CreditNoteListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.noteType && params.noteType !== "all") search.set("noteType", params.noteType);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.invoiceId?.trim()) search.set("invoiceId", params.invoiceId.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchNextCreditNoteNumber(
  organisationId: string,
  noteType: CreditNoteType = "credit",
): Promise<NextCreditNoteNumber> {
  const res = await fetch(
    `/api/sales/credit-notes/next-number?organisationId=${encodeURIComponent(organisationId)}&noteType=${encodeURIComponent(noteType)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load note number");
  }
  const data = normalizeNextCreditNoteNumber(body);
  if (!data) throw new Error("Failed to load note number");
  return data;
}

export async function fetchCreditNotes(
  organisationId: string,
  params: CreditNoteListParams = {},
): Promise<CreditNoteListResponse> {
  const res = await fetch(`/api/sales/credit-notes?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load credit notes");
  }
  return normalizeCreditNoteListResponse(body);
}

export async function fetchCreditNoteDetail(
  organisationId: string,
  creditNoteId: string,
): Promise<CreditNoteDetail> {
  const res = await fetch(
    `/api/sales/credit-notes/${encodeURIComponent(creditNoteId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load credit note");
  }
  const creditNote = normalizeCreditNoteDetailResponse(body);
  if (!creditNote) throw new Error("Failed to load credit note");
  return creditNote;
}

export async function createCreditNote(
  organisationId: string,
  payload: CreateCreditNoteRequest,
): Promise<CreditNoteDetail> {
  const res = await fetch(
    `/api/sales/credit-notes?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create credit note");
  }
  const creditNote = normalizeCreditNoteDetailResponse(body);
  if (!creditNote) throw new Error("Failed to create credit note");
  return creditNote;
}
