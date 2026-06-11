import { extractBackendError } from "@/lib/api/inventory";
import type {
  ExpenseAttachment,
  ExpenseCategory,
  ExpenseDetail,
  ExpenseListResponse,
  ExpenseSummary,
  NextExpenseNumber,
} from "@/lib/types/expenses-api";

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

export function normalizeExpenseCategory(raw: unknown): ExpenseCategory | null {
  const row = asRecord(raw);
  if (!row) return null;
  const categoryId = pickString(row.categoryId, row.id);
  const name = pickString(row.name);
  if (!categoryId || !name) return null;
  return {
    categoryId,
    name,
    ...(pickString(row.description) && { description: pickString(row.description) }),
  };
}

export function normalizeNextExpenseNumber(raw: unknown): NextExpenseNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const expensePrefix = pickString(row.expensePrefix, row.prefix);
  const expenseNumber = pickString(row.expenseNumber, row.number);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!expensePrefix || !expenseNumber || !suggestedDisplay) return null;
  return { expensePrefix, expenseNumber, suggestedDisplay };
}

function normalizeExpenseAttachment(raw: unknown): ExpenseAttachment | null {
  const row = asRecord(raw);
  if (!row) return null;
  const fileName = pickString(row.fileName);
  const contentType = pickString(row.contentType);
  const size = pickNumber(row.size);
  const url = pickString(row.url);
  if (!fileName || !contentType || size === undefined || !url) return null;
  return { fileName, contentType, size, url };
}

function mapExpenseStatus(raw: string | undefined): ExpenseSummary["status"] | undefined {
  if (raw === "recorded" || raw === "completed") return "completed";
  if (raw === "cancelled") return "cancelled";
  return undefined;
}

export function normalizeExpenseSummary(raw: unknown): ExpenseSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const expenseId = pickString(row.expenseId, row.id);
  const category = pickString(row.category, row.categoryName);
  const expenseDate = pickString(row.expenseDate);
  const amount = pickNumber(row.amount) ?? pickNumber(row.totalAmount);
  const paymentMode = pickString(row.paymentMode) as ExpenseSummary["paymentMode"] | undefined;
  const status = mapExpenseStatus(pickString(row.status));

  if (!expenseId || !category || !expenseDate || amount === undefined || !paymentMode || !status) {
    return null;
  }

  const attachmentsRaw = Array.isArray(row.attachments) ? row.attachments : [];
  const attachments = attachmentsRaw
    .map((item) => normalizeExpenseAttachment(item))
    .filter((item): item is ExpenseAttachment => item !== null);

  return {
    expenseId,
    displayNumber: pickString(row.displayNumber) ?? expenseId,
    categoryId: pickString(row.categoryId) ?? category,
    categoryName: category,
    expenseDate,
    amount,
    paymentMode,
    status,
    ...(pickString(row.notes, row.description) && {
      description: pickString(row.notes, row.description),
    }),
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

export function normalizeExpenseDetail(raw: unknown): ExpenseDetail | null {
  const summary = normalizeExpenseSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const expensePrefix = pickString(row.expensePrefix) ?? "";
  const expenseNumber = pickString(row.expenseNumber);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (!organisationId || !createdByUserId || !createdAt || !updatedAt) {
    return null;
  }

  return {
    ...summary,
    organisationId,
    expensePrefix,
    expenseNumber: expenseNumber ?? summary.expenseId,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.referenceNumber) && { referenceNumber: pickString(row.referenceNumber) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizeExpenseListResponse(body: unknown): ExpenseListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeExpenseSummary(item))
      .filter((item): item is ExpenseSummary => item !== null),
    pagination,
  };
}

export function normalizeExpenseDetailResponse(body: unknown): ExpenseDetail | null {
  return normalizeExpenseDetail(unwrapData(body));
}

export function normalizeExpenseCategoriesResponse(body: unknown): ExpenseCategory[] {
  const data = unwrapData(body);
  const row = asRecord(data);
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === "string" && item.trim()) {
          return { categoryId: item.trim(), name: item.trim() };
        }
        return normalizeExpenseCategory(item);
      })
      .filter((item): item is ExpenseCategory => item !== null);
  }
  const categories = Array.isArray(row?.categories) ? row.categories : [];
  return categories
    .map((name) => {
      if (typeof name !== "string" || !name.trim()) return null;
      return { categoryId: name.trim(), name: name.trim() };
    })
    .filter((item): item is ExpenseCategory => item !== null);
}
