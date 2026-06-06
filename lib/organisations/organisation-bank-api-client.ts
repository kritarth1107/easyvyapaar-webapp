import {
  extractBackendError,
  normalizeOrganisationBankAccountsResponse,
} from "@/lib/api/organisation-bank";
import type {
  OrganisationBankAccount,
  UpsertOrganisationBankAccountRequest,
} from "@/lib/types/organisation-bank-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrganisationBankAccounts(
  organisationId: string,
): Promise<OrganisationBankAccount[]> {
  const res = await fetch(
    `/api/business/bank-accounts?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load bank accounts");
  }
  const data = normalizeOrganisationBankAccountsResponse(body);
  if (!data) {
    throw new Error("Failed to load bank accounts");
  }
  return data.bankAccounts;
}

export async function addOrganisationBankAccount(
  organisationId: string,
  payload: UpsertOrganisationBankAccountRequest,
): Promise<OrganisationBankAccount[]> {
  const res = await fetch(
    `/api/business/bank-accounts?organisationId=${encodeURIComponent(organisationId)}`,
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
  const data = normalizeOrganisationBankAccountsResponse(body);
  if (!data) {
    throw new Error("Failed to add bank account");
  }
  return data.bankAccounts;
}

export async function updateOrganisationBankAccount(
  organisationId: string,
  bankAccountId: string,
  payload: UpsertOrganisationBankAccountRequest,
): Promise<OrganisationBankAccount[]> {
  const res = await fetch(
    `/api/business/bank-accounts/${encodeURIComponent(bankAccountId)}?organisationId=${encodeURIComponent(organisationId)}`,
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
  const data = normalizeOrganisationBankAccountsResponse(body);
  if (!data) {
    throw new Error("Failed to update bank account");
  }
  return data.bankAccounts;
}

export async function deleteOrganisationBankAccount(
  organisationId: string,
  bankAccountId: string,
): Promise<OrganisationBankAccount[]> {
  const res = await fetch(
    `/api/business/bank-accounts/${encodeURIComponent(bankAccountId)}?organisationId=${encodeURIComponent(organisationId)}`,
    { method: "DELETE" },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to delete bank account");
  }
  const data = normalizeOrganisationBankAccountsResponse(body);
  if (!data) {
    throw new Error("Failed to delete bank account");
  }
  return data.bankAccounts;
}
