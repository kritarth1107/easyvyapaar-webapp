import { extractBackendError } from "@/lib/api/inventory";
import type {
  PartyBankAccount,
  PartyCustomField,
  PartyDashboardSummary,
  PartyDetail,
  PartyLastTransaction,
  PartyLedgerEntry,
  PartyLedgerStatement,
  PartyListResponse,
  PartySummary,
  PaginationMeta,
} from "@/lib/types/parties-api";
import type { PartyType } from "@/lib/types/parties-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export { extractBackendError };

export function normalizePagination(raw: unknown): PaginationMeta | null {
  const row = asRecord(raw);
  if (!row) return null;
  const page = pickNumber(row.page);
  const limit = pickNumber(row.limit);
  const total = pickNumber(row.total);
  const totalPages = pickNumber(row.totalPages);
  if (page === undefined || limit === undefined || total === undefined || totalPages === undefined) {
    return null;
  }
  return { page, limit, total, totalPages };
}

export function normalizePartySummary(raw: unknown): PartySummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const partyId = pickString(row.partyId, row.id);
  const name = pickString(row.name);
  const type = pickString(row.type, row.partyType) as PartySummary["type"] | undefined;
  const partyCategory = pickString(row.partyCategory);
  const balance = pickNumber(row.balance ?? row.currentBalance);
  const transactionCount = pickNumber(row.transactionCount);

  if (!partyId || !name || !type || !partyCategory || balance === undefined || transactionCount === undefined) {
    return null;
  }

  return {
    partyId,
    name,
    type,
    partyCategory,
    balance,
    creditLimit: pickNumber(row.creditLimit) ?? 0,
    transactionCount,
    isActive: Boolean(row.isActive ?? row.status === "ACTIVE"),
    ...(pickString(row.phone) && { phone: pickString(row.phone) }),
    ...(pickString(row.email) && { email: pickString(row.email) }),
    ...(pickString(row.gstin) && { gstin: pickString(row.gstin) }),
    ...(pickString(row.pan) && { pan: pickString(row.pan) }),
    ...(pickString(row.billingAddress) && { billingAddress: pickString(row.billingAddress) }),
    ...(pickString(row.billingStateCode) && { billingStateCode: pickString(row.billingStateCode) }),
    ...(pickString(row.lastTransactionDate) && {
      lastTransactionDate: pickString(row.lastTransactionDate),
    }),
  };
}

export function normalizePartyListResponse(body: unknown): PartyListResponse {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const dataRow = asRecord(data);

  const itemsRaw = Array.isArray(data)
    ? data
    : Array.isArray(dataRow?.items)
      ? dataRow.items
      : [];

  const pagination = normalizePagination(dataRow?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizePartySummary(item))
      .filter((item): item is PartySummary => item !== null),
    pagination,
  };
}

function normalizeBankAccount(raw: unknown): PartyBankAccount | null {
  const row = asRecord(raw);
  if (!row) return null;
  const bankAccountId = pickString(row.bankAccountId, row.id);
  if (!bankAccountId) return null;
  return {
    bankAccountId,
    accountHolderName: pickString(row.accountHolderName) ?? "",
    bankName: pickString(row.bankName) ?? "",
    accountNumber: pickString(row.accountNumber) ?? "",
    ifscCode: pickString(row.ifscCode) ?? "",
    branchName: pickString(row.branchName) ?? "",
    isPrimary: Boolean(row.isPrimary),
  };
}

function normalizeCustomField(raw: unknown): PartyCustomField | null {
  const row = asRecord(raw);
  if (!row) return null;
  const fieldType = pickString(row.fieldType);
  const fieldLabel = pickString(row.fieldLabel);
  const value = pickString(row.value);
  if (!fieldType || !fieldLabel || !value) return null;
  return { fieldType, fieldLabel, value };
}

function normalizeLastTransaction(raw: unknown): PartyLastTransaction | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  return {
    ...(pickString(row.date) && { date: pickString(row.date) }),
    ...(pickString(row.invoiceNumber) && { invoiceNumber: pickString(row.invoiceNumber) }),
    ...(pickString(row.type) && { type: pickString(row.type) }),
    ...(pickNumber(row.amount) !== undefined && { amount: pickNumber(row.amount) }),
  };
}

export function normalizePartyDetail(raw: unknown): PartyDetail | null {
  const row = asRecord(raw);
  if (!row) return null;

  const partyId = pickString(row.partyId);
  const organisationId = pickString(row.organisationId);
  const partyType = pickString(row.partyType) as PartyType | undefined;
  const partyCategory = pickString(row.partyCategory);
  const name = pickString(row.name);
  const openingBalanceAmount = pickNumber(row.openingBalanceAmount);
  const currentBalance = pickNumber(row.currentBalance);
  const creditPeriodDays = pickNumber(row.creditPeriodDays);
  const creditLimit = pickNumber(row.creditLimit);
  const transactionCount = pickNumber(row.transactionCount);
  const status = pickString(row.status) as PartyDetail["status"] | undefined;
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);
  const openingBalanceType = pickString(row.openingBalanceType) as
    | PartyDetail["openingBalanceType"]
    | undefined;

  if (
    !partyId ||
    !organisationId ||
    !partyType ||
    !partyCategory ||
    !name ||
    openingBalanceAmount === undefined ||
    currentBalance === undefined ||
    creditPeriodDays === undefined ||
    creditLimit === undefined ||
    transactionCount === undefined ||
    !status ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt ||
    !openingBalanceType
  ) {
    return null;
  }

  const bankAccounts = Array.isArray(row.bankAccounts)
    ? row.bankAccounts
        .map((entry) => normalizeBankAccount(entry))
        .filter((entry): entry is PartyBankAccount => entry !== null)
    : [];

  const customFields = Array.isArray(row.customFields)
    ? row.customFields
        .map((entry) => normalizeCustomField(entry))
        .filter((entry): entry is PartyCustomField => entry !== null)
    : [];

  return {
    partyId,
    organisationId,
    partyType,
    partyCategory,
    name,
    openingBalanceAmount,
    openingBalanceType,
    currentBalance,
    creditPeriodDays,
    creditLimit,
    transactionCount,
    status,
    bankAccounts,
    customFields,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.phone) && { phone: pickString(row.phone) }),
    ...(pickString(row.email) && { email: pickString(row.email) }),
    ...(pickString(row.gstin) && { gstin: pickString(row.gstin) }),
    ...(pickString(row.pan) && { pan: pickString(row.pan) }),
    ...(pickString(row.billingAddress) && { billingAddress: pickString(row.billingAddress) }),
    ...(pickString(row.billingStateCode) && { billingStateCode: pickString(row.billingStateCode) }),
    ...(pickString(row.shippingAddress) && { shippingAddress: pickString(row.shippingAddress) }),
    ...(pickString(row.contactPersonName) && { contactPersonName: pickString(row.contactPersonName) }),
    ...(pickString(row.contactPersonDob) && { contactPersonDob: pickString(row.contactPersonDob) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
    ...(row.lastTransaction ? { lastTransaction: normalizeLastTransaction(row.lastTransaction) } : {}),
  };
}

export function normalizePartyDetailResponse(body: unknown): PartyDetail | null {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  return normalizePartyDetail(data);
}

export function normalizePartyDashboardSummary(body: unknown): PartyDashboardSummary | null {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const row = asRecord(data);
  if (!row) return null;

  const totalParties = pickNumber(row.totalParties);
  const customers = pickNumber(row.customers);
  const suppliers = pickNumber(row.suppliers);

  if (totalParties === undefined || customers === undefined || suppliers === undefined) {
    return null;
  }

  return {
    totalParties,
    customers,
    suppliers,
    both: pickNumber(row.both) ?? 0,
    toCollect: pickNumber(row.toCollect) ?? 0,
    toPay: pickNumber(row.toPay) ?? 0,
    netOutstanding: pickNumber(row.netOutstanding) ?? 0,
    withBalance: pickNumber(row.withBalance) ?? 0,
  };
}

function normalizePartyLedgerEntry(raw: unknown): PartyLedgerEntry | null {
  const row = asRecord(raw);
  if (!row) return null;
  const ledgerEntryId = pickString(row.ledgerEntryId);
  const entryType = pickString(row.entryType) as PartyLedgerEntry["entryType"] | undefined;
  const entryDate = pickString(row.entryDate);
  const referenceNumber = pickString(row.referenceNumber);
  const debit = pickNumber(row.debit);
  const credit = pickNumber(row.credit);
  const amount = pickNumber(row.amount);
  const balance = pickNumber(row.balance);
  const affectsBalance = row.affectsBalance;

  if (
    !ledgerEntryId ||
    !entryType ||
    !entryDate ||
    !referenceNumber ||
    debit === undefined ||
    credit === undefined ||
    amount === undefined ||
    balance === undefined ||
    typeof affectsBalance !== "boolean"
  ) {
    return null;
  }

  return {
    ledgerEntryId,
    entryType,
    entryDate,
    referenceNumber,
    debit,
    credit,
    amount,
    affectsBalance,
    balance,
    ...(pickString(row.referenceId) ? { referenceId: pickString(row.referenceId) } : {}),
    ...(pickString(row.description) ? { description: pickString(row.description) } : {}),
  };
}

export function normalizePartyLedgerStatement(body: unknown): PartyLedgerStatement | null {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const row = asRecord(data);
  if (!row) return null;

  const openingBalance = pickNumber(row.openingBalance);
  const closingBalance = pickNumber(row.closingBalance);
  const totalSales = pickNumber(row.totalSales);
  const totalReceived = pickNumber(row.totalReceived);
  const totalReturns = pickNumber(row.totalReturns);

  if (
    openingBalance === undefined ||
    closingBalance === undefined ||
    totalSales === undefined ||
    totalReceived === undefined ||
    totalReturns === undefined
  ) {
    return null;
  }

  const entriesRaw = Array.isArray(row.entries) ? row.entries : [];
  return {
    openingBalance,
    closingBalance,
    totalSales,
    totalReceived,
    totalReturns,
    entries: entriesRaw
      .map((entry) => normalizePartyLedgerEntry(entry))
      .filter((entry): entry is PartyLedgerEntry => entry !== null),
  };
}
