import {
  extractBackendError,
  normalizePartyDashboardSummary,
  normalizePartyDetailResponse,
  normalizePartyListResponse,
} from "@/lib/api/parties";
import { normalizePartyLedgerStatement } from "@/lib/api/parties";
import type {
  CreatePartyRequest,
  PartyDashboardSummary,
  PartyDetail,
  PartyLedgerParams,
  PartyLedgerStatement,
  PartyListParams,
  PartyListResponse,
  UpdatePartyRequest,
  UpsertPartyBankAccountRequest,
} from "@/lib/types/parties-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: PartyListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.view) search.set("view", params.view);
  if (params.partyType && params.partyType !== "all") search.set("partyType", params.partyType);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.balance && params.balance !== "all") search.set("balance", params.balance);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchParties(
  organisationId: string,
  params: PartyListParams = {},
): Promise<PartyListResponse> {
  const res = await fetch(`/api/parties?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load parties");
  }
  return normalizePartyListResponse(body);
}

export async function fetchPartiesSummary(organisationId: string): Promise<PartyDashboardSummary> {
  const res = await fetch(
    `/api/parties/summary?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load party summary");
  }
  const summary = normalizePartyDashboardSummary(body);
  if (!summary) {
    throw new Error("Failed to load party summary");
  }
  return summary;
}

export async function fetchPartyDetail(
  organisationId: string,
  partyId: string,
): Promise<PartyDetail> {
  const res = await fetch(
    `/api/parties/${encodeURIComponent(partyId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load party");
  }
  const party = normalizePartyDetailResponse(body);
  if (!party) {
    throw new Error("Failed to load party");
  }
  return party;
}

export async function fetchPartyLedger(
  organisationId: string,
  partyId: string,
  params: PartyLedgerParams = {},
): Promise<PartyLedgerStatement> {
  const search = new URLSearchParams({ organisationId });
  if (params.from?.trim()) search.set("from", params.from.trim());
  if (params.to?.trim()) search.set("to", params.to.trim());

  const res = await fetch(
    `/api/parties/${encodeURIComponent(partyId)}/ledger?${search.toString()}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load party ledger");
  }
  const statement = normalizePartyLedgerStatement(body);
  if (!statement) {
    throw new Error("Failed to load party ledger");
  }
  return statement;
}

export async function addPartyBankAccount(
  organisationId: string,
  partyId: string,
  payload: UpsertPartyBankAccountRequest,
): Promise<PartyDetail> {
  const res = await fetch(
    `/api/parties/${encodeURIComponent(partyId)}/bank-accounts?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to add bank account");
  }
  const party = normalizePartyDetailResponse(body);
  if (!party) {
    throw new Error("Failed to add bank account");
  }
  return party;
}

export async function updatePartyBankAccount(
  organisationId: string,
  partyId: string,
  bankAccountId: string,
  payload: UpsertPartyBankAccountRequest,
): Promise<PartyDetail> {
  const res = await fetch(
    `/api/parties/${encodeURIComponent(partyId)}/bank-accounts/${encodeURIComponent(bankAccountId)}?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to update bank account");
  }
  const party = normalizePartyDetailResponse(body);
  if (!party) {
    throw new Error("Failed to update bank account");
  }
  return party;
}

export async function deletePartyBankAccount(
  organisationId: string,
  partyId: string,
  bankAccountId: string,
): Promise<PartyDetail> {
  const res = await fetch(
    `/api/parties/${encodeURIComponent(partyId)}/bank-accounts/${encodeURIComponent(bankAccountId)}?organisationId=${encodeURIComponent(organisationId)}`,
    { method: "DELETE" },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to delete bank account");
  }
  const party = normalizePartyDetailResponse(body);
  if (!party) {
    throw new Error("Failed to delete bank account");
  }
  return party;
}

export async function updateParty(
  organisationId: string,
  partyId: string,
  payload: Partial<UpdatePartyRequest>,
): Promise<PartyDetail> {
  const res = await fetch(
    `/api/parties/${encodeURIComponent(partyId)}?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to update party");
  }
  const party = normalizePartyDetailResponse(body);
  if (!party) {
    throw new Error("Failed to update party");
  }
  return party;
}

export async function createParty(payload: CreatePartyRequest): Promise<PartyDetail> {
  const res = await fetch("/api/parties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create party");
  }
  const party = normalizePartyDetailResponse(body);
  if (!party) {
    throw new Error("Failed to create party");
  }
  return party;
}
