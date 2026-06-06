import { extractBackendError } from "@/lib/api/inventory";
import type { DaybookEntry, DaybookListResponse } from "@/lib/types/daybook-api";

export { extractBackendError };

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

function unwrapData(body: unknown): unknown {
  const root = asRecord(body);
  if (root?.success === true && root.data !== undefined) return root.data;
  return body;
}

function normalizePagination(raw: unknown) {
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

export function normalizeDaybookEntry(raw: unknown): DaybookEntry | null {
  const row = asRecord(raw);
  if (!row) return null;

  const entryId = pickString(row.entryId, row.id);
  const entryDate = pickString(row.entryDate, row.date);
  const entryType = pickString(row.entryType, row.type) as DaybookEntry["entryType"] | undefined;
  const referenceNumber = pickString(row.referenceNumber, row.reference);
  const debit = pickNumber(row.debit);
  const credit = pickNumber(row.credit);
  const balance = pickNumber(row.balance) ?? 0;

  if (!entryId || !entryDate || !entryType || !referenceNumber || debit === undefined || credit === undefined) {
    return null;
  }

  return {
    entryId,
    entryDate,
    entryType,
    referenceNumber,
    debit,
    credit,
    balance,
    ...(pickString(row.partyName) && { partyName: pickString(row.partyName) }),
    ...(pickString(row.description) && { description: pickString(row.description) }),
  };
}

export function normalizeDaybookListResponse(body: unknown): DaybookListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : Array.isArray(row?.entries) ? row.entries : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeDaybookEntry(item))
      .filter((item): item is DaybookEntry => item !== null),
    pagination,
    ...(pickNumber(row?.openingBalance) !== undefined && { openingBalance: pickNumber(row?.openingBalance) }),
    ...(pickNumber(row?.closingBalance) !== undefined && { closingBalance: pickNumber(row?.closingBalance) }),
  };
}
