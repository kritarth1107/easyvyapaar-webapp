import { extractBackendError } from "@/lib/api/inventory";
import type {
  CashBankAccount,
  CashBankSummary,
  CashBankTransaction,
  CashBankTransactionsResponse,
} from "@/lib/types/cash-bank-api";

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

export function normalizeCashBankAccount(raw: unknown): CashBankAccount | null {
  const row = asRecord(raw);
  if (!row) return null;

  const accountId = pickString(row.accountId, row.id);
  const accountType = pickString(row.accountType, row.type) as CashBankAccount["accountType"] | undefined;
  const name = pickString(row.name);
  const balance = pickNumber(row.balance);

  if (!accountId || (accountType !== "cash" && accountType !== "bank") || !name || balance === undefined) {
    return null;
  }

  return {
    accountId,
    accountType,
    name,
    balance,
    ...(pickString(row.bankName) && { bankName: pickString(row.bankName) }),
    ...(pickString(row.accountNumber) && { accountNumber: pickString(row.accountNumber) }),
    ...(pickString(row.ifsc) && { ifsc: pickString(row.ifsc) }),
  };
}

export function normalizeCashBankSummary(body: unknown): CashBankSummary {
  const data = unwrapData(body);
  const row = asRecord(data);

  const cashInHand = pickNumber(row?.cashInHand) ?? pickNumber(row?.totalCash);
  const totalBankBalance = pickNumber(row?.totalBankBalance) ?? pickNumber(row?.totalBank);
  const modeSummary = Array.isArray(row?.modeSummary) ? row.modeSummary : [];
  const bankAccountsRaw = Array.isArray(row?.bankAccounts) ? row.bankAccounts : [];
  const legacyAccountsRaw = Array.isArray(row?.accounts) ? row.accounts : [];

  const accounts: CashBankAccount[] = [];

  if (cashInHand !== undefined) {
    accounts.push({
      accountId: "cash",
      accountType: "cash",
      name: "Cash in hand",
      balance: cashInHand,
    });
  }

  for (const bankRaw of bankAccountsRaw) {
    const bankRow = asRecord(bankRaw);
    const bankAccountId = pickString(bankRow?.bankAccountId, bankRow?.accountId);
    const bankName = pickString(bankRow?.bankName) ?? "Bank account";
    const balance = pickNumber(bankRow?.balance) ?? 0;
    if (!bankAccountId) continue;
    accounts.push({
      accountId: bankAccountId,
      accountType: "bank",
      name: bankName,
      balance,
      ...(pickString(bankRow?.bankName) && { bankName: pickString(bankRow?.bankName) }),
      ...(pickString(bankRow?.accountNumber) && { accountNumber: pickString(bankRow?.accountNumber) }),
    });
  }

  if (accounts.length === 0 && legacyAccountsRaw.length > 0) {
    for (const item of legacyAccountsRaw) {
      const account = normalizeCashBankAccount(item);
      if (account) accounts.push(account);
    }
  }

  const modeNetTotal = modeSummary.reduce((sum, item) => {
    const modeRow = asRecord(item);
    return sum + (pickNumber(modeRow?.netBalance) ?? 0);
  }, 0);

  const totalCash =
    cashInHand ??
    accounts.filter((a) => a.accountType === "cash").reduce((s, a) => s + a.balance, 0);
  const totalBank =
    totalBankBalance ??
    accounts.filter((a) => a.accountType === "bank").reduce((s, a) => s + a.balance, 0);
  const totalBalance =
    pickNumber(row?.totalBalance) ??
    (modeSummary.length > 0 ? modeNetTotal : totalCash + totalBank);

  return { totalCash, totalBank, totalBalance, accounts };
}

export function normalizeCashBankTransaction(raw: unknown): CashBankTransaction | null {
  const row = asRecord(raw);
  if (!row) return null;

  const transactionId = pickString(row.transactionId, row.id);
  const accountId = pickString(row.accountId);
  const accountName = pickString(row.accountName);
  const transactionDate = pickString(row.transactionDate, row.date);
  const description = pickString(row.description) ?? "";
  const debit = pickNumber(row.debit);
  const credit = pickNumber(row.credit);
  const balance = pickNumber(row.balance) ?? 0;

  if (!transactionId || !accountId || !accountName || !transactionDate || debit === undefined || credit === undefined) {
    return null;
  }

  return { transactionId, accountId, accountName, transactionDate, description, debit, credit, balance };
}

export function normalizeCashBankTransactionsResponse(body: unknown): CashBankTransactionsResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : Array.isArray(row?.transactions) ? row.transactions : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeCashBankTransaction(item))
      .filter((item): item is CashBankTransaction => item !== null),
    pagination,
  };
}
