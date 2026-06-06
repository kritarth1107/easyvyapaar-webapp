import {
  extractBackendError,
  normalizeExpenseCategoriesResponse,
  normalizeExpenseDetailResponse,
  normalizeExpenseListResponse,
  normalizeNextExpenseNumber,
} from "@/lib/api/expenses";
import type {
  CreateExpenseRequest,
  ExpenseCategory,
  ExpenseDetail,
  ExpenseListParams,
  ExpenseListResponse,
  NextExpenseNumber,
} from "@/lib/types/expenses-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildQuery(organisationId: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "all" && String(value).trim()) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export async function fetchExpenseCategories(organisationId: string): Promise<ExpenseCategory[]> {
  const res = await fetch(
    `/api/finance/expenses/categories?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load expense categories");
  return normalizeExpenseCategoriesResponse(body);
}

export async function fetchNextExpenseNumber(organisationId: string): Promise<NextExpenseNumber> {
  const res = await fetch(
    `/api/finance/expenses/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load expense number");
  const data = normalizeNextExpenseNumber(body);
  if (!data) throw new Error("Failed to load expense number");
  return data;
}

export async function fetchExpenses(
  organisationId: string,
  params: ExpenseListParams = {},
): Promise<ExpenseListResponse> {
  const res = await fetch(
    `/api/finance/expenses?${buildQuery(organisationId, {
      categoryId: params.categoryId,
      status: params.status,
      search: params.search,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load expenses");
  return normalizeExpenseListResponse(body);
}

export async function fetchExpenseDetail(
  organisationId: string,
  expenseId: string,
): Promise<ExpenseDetail> {
  const res = await fetch(
    `/api/finance/expenses/${encodeURIComponent(expenseId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load expense");
  const expense = normalizeExpenseDetailResponse(body);
  if (!expense) throw new Error("Failed to load expense");
  return expense;
}

export async function createExpense(
  organisationId: string,
  payload: CreateExpenseRequest,
): Promise<ExpenseDetail> {
  const backendPayload = {
    category: payload.categoryId,
    expenseDate: payload.expenseDate,
    amount: payload.amount,
    paymentMode: payload.paymentMode ?? "cash",
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
    ...(payload.description?.trim() ? { notes: payload.description.trim() } : {}),
    ...(payload.referenceNumber?.trim() ? { notes: payload.referenceNumber.trim() } : {}),
  };
  const res = await fetch(
    `/api/finance/expenses?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create expense");
  const expense = normalizeExpenseDetailResponse(body);
  if (!expense) throw new Error("Failed to create expense");
  return expense;
}
