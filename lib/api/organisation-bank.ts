import type {
  OrganisationBankAccount,
  OrganisationBankAccountsResponse,
} from "@/lib/types/organisation-bank-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export function extractBackendError(body: unknown): string | null {
  const root = asRecord(body);
  if (!root) return null;
  if (typeof root.error === "string" && root.error.trim()) return root.error;
  const nested = root.error;
  if (typeof nested === "object" && nested !== null) {
    const err = nested as Record<string, unknown>;
    if (typeof err.details === "string" && err.details.trim()) return err.details;
    if (typeof err.description === "string" && err.description.trim()) return err.description;
  }
  if (typeof root.message === "string" && root.message.trim()) return root.message;
  return null;
}

function normalizeBankAccount(raw: unknown): OrganisationBankAccount | null {
  const row = asRecord(raw);
  if (!row) return null;

  const bankAccountId = pickString(row.bankAccountId);
  const accountHolderName = pickString(row.accountHolderName) ?? "";
  const bankName = pickString(row.bankName) ?? "";
  const accountNumber = pickString(row.accountNumber) ?? "";
  const ifscCode = pickString(row.ifscCode) ?? "";
  const branchName = pickString(row.branchName) ?? "";

  if (!bankAccountId) return null;

  return {
    bankAccountId,
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    isPrimary: Boolean(row.isPrimary),
  };
}

export function normalizeOrganisationBankAccountsResponse(
  body: unknown,
): OrganisationBankAccountsResponse | null {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const row = asRecord(data);
  if (!row) return null;

  const bankAccounts = Array.isArray(row.bankAccounts)
    ? row.bankAccounts
        .map((entry) => normalizeBankAccount(entry))
        .filter((entry): entry is OrganisationBankAccount => entry !== null)
    : [];

  return { bankAccounts };
}
