import { extractBackendError } from "@/lib/api/inventory";
import type { ShopDashboardStats, WeekdayKey } from "@/lib/dashboard/shop-workspace";

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

const WEEKDAY_KEYS = new Set<WeekdayKey>(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

function isWeekdayKey(value: string): value is WeekdayKey {
  return WEEKDAY_KEYS.has(value as WeekdayKey);
}

function normalizeSlice(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const id = pickString(row.id);
  const label = pickString(row.label);
  const amount = pickNumber(row.amount);
  if (!id || !label || amount === undefined) return null;
  const count = pickNumber(row.count);
  return { id, label, amount, ...(count !== undefined ? { count } : {}) };
}

export function normalizeDashboardOverview(body: unknown): ShopDashboardStats | null {
  const data = unwrapData(body);
  const row = asRecord(data);
  if (!row) return null;

  const organisationId = pickString(row.organisationId);
  const salesToday = pickNumber(row.salesToday);
  const salesTodayDelta = pickNumber(row.salesTodayDelta);
  const invoicesToday = pickNumber(row.invoicesToday);
  const toCollect = pickNumber(row.toCollect);
  const toPay = pickNumber(row.toPay);
  const lowStockCount = pickNumber(row.lowStockCount);

  if (
    !organisationId ||
    salesToday === undefined ||
    salesTodayDelta === undefined ||
    invoicesToday === undefined ||
    toCollect === undefined ||
    toPay === undefined ||
    lowStockCount === undefined
  ) {
    return null;
  }

  const weeklySalesRaw = Array.isArray(row.weeklySales) ? row.weeklySales : [];
  const weeklySales = weeklySalesRaw
    .map((item) => {
      const w = asRecord(item);
      const date = pickString(w?.date);
      const dayKey = pickString(w?.dayKey);
      const amount = pickNumber(w?.amount);
      const invoiceCount = pickNumber(w?.invoiceCount);
      if (!date || !dayKey || amount === undefined || invoiceCount === undefined) return null;
      if (!isWeekdayKey(dayKey)) return null;
      return { date, dayKey, amount, invoiceCount };
    })
    .filter(
      (item): item is { date: string; dayKey: WeekdayKey; amount: number; invoiceCount: number } =>
        item !== null,
    );

  const mapSlices = (key: string) =>
    (Array.isArray(row[key]) ? row[key] : [])
      .map((item) => normalizeSlice(item))
      .filter((item): item is NonNullable<ReturnType<typeof normalizeSlice>> => item !== null);

  const monthlyTrendRaw = Array.isArray(row.monthlyTrend) ? row.monthlyTrend : [];
  const monthlyTrend = monthlyTrendRaw
    .map((item) => {
      const m = asRecord(item);
      const monthKey = pickString(m?.monthKey);
      const monthLabel = pickString(m?.monthLabel);
      const sales = pickNumber(m?.sales);
      const purchases = pickNumber(m?.purchases);
      const expenses = pickNumber(m?.expenses);
      if (!monthKey || !monthLabel || sales === undefined || purchases === undefined || expenses === undefined) {
        return null;
      }
      return { monthKey, monthLabel, sales, purchases, expenses };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const topSellingItemsRaw = Array.isArray(row.topSellingItems) ? row.topSellingItems : [];
  const topSellingItems = topSellingItemsRaw
    .map((item) => {
      const t = asRecord(item);
      const itemId = pickString(t?.itemId);
      const name = pickString(t?.name);
      const qty = pickNumber(t?.qty);
      const revenue = pickNumber(t?.revenue);
      if (!itemId || !name || qty === undefined || revenue === undefined) return null;
      return { itemId, name, qty, revenue };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const lowStockItemsRaw = Array.isArray(row.lowStockItems) ? row.lowStockItems : [];
  const lowStockItems = lowStockItemsRaw
    .map((item) => {
      const l = asRecord(item);
      const itemId = pickString(l?.itemId);
      const name = pickString(l?.name);
      const currentStock = pickNumber(l?.currentStock);
      const lowStockQty = pickNumber(l?.lowStockQty);
      const unit = pickString(l?.unit);
      if (!itemId || !name || currentStock === undefined || lowStockQty === undefined || !unit) return null;
      return { itemId, name, currentStock, lowStockQty, unit };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const recentActivityRaw = Array.isArray(row.recentActivity) ? row.recentActivity : [];
  const recentActivity = recentActivityRaw
    .map((item) => {
      const a = asRecord(item);
      const id = pickString(a?.id);
      const type = pickString(a?.type);
      const title = pickString(a?.title);
      const date = pickString(a?.date);
      if (!id || !type || !title || !date) return null;
      return {
        id,
        type,
        title,
        date,
        ...(pickString(a?.subtitle) && { subtitle: pickString(a?.subtitle) }),
        ...(pickNumber(a?.amount) !== undefined && { amount: pickNumber(a?.amount) }),
        ...(pickString(a?.referenceId) && { referenceId: pickString(a?.referenceId) }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const alertsRaw = Array.isArray(row.alerts) ? row.alerts : [];
  const alerts = alertsRaw
    .map((item) => {
      const a = asRecord(item);
      const id = pickString(a?.id);
      const type = pickString(a?.type);
      const message = pickString(a?.message);
      if (!id || (type !== "warning" && type !== "info") || !message) return null;
      const alertType: "warning" | "info" = type;
      return {
        id,
        type: alertType,
        message,
        ...(pickNumber(a?.count) !== undefined && { count: pickNumber(a?.count) }),
        ...(pickString(a?.href) && { href: pickString(a?.href) }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    organisationId,
    generatedAt: pickString(row.generatedAt) ?? new Date().toISOString(),
    salesToday,
    salesYesterday: pickNumber(row.salesYesterday) ?? 0,
    salesTodayDelta,
    invoicesToday,
    salesThisMonth: pickNumber(row.salesThisMonth) ?? 0,
    purchasesThisMonth: pickNumber(row.purchasesThisMonth) ?? 0,
    expensesThisMonth: pickNumber(row.expensesThisMonth) ?? 0,
    profitEstimateThisMonth: pickNumber(row.profitEstimateThisMonth) ?? 0,
    cashInHand: pickNumber(row.cashInHand) ?? 0,
    totalBankBalance: pickNumber(row.totalBankBalance) ?? 0,
    totalCashBalance: pickNumber(row.totalCashBalance) ?? 0,
    toCollect,
    toPay,
    netOutstanding: pickNumber(row.netOutstanding) ?? toCollect - toPay,
    lowStockCount,
    outOfStockCount: pickNumber(row.outOfStockCount) ?? 0,
    totalItems: pickNumber(row.totalItems) ?? 0,
    totalStockValue: pickNumber(row.totalStockValue) ?? 0,
    totalRetailValue: pickNumber(row.totalRetailValue) ?? 0,
    pendingPurchaseOrders: pickNumber(row.pendingPurchaseOrders) ?? 0,
    overdueInvoicesCount: pickNumber(row.overdueInvoicesCount) ?? 0,
    weeklySales,
    monthlyTrend,
    salesByPaymentMode: mapSlices("salesByPaymentMode"),
    stockByCategory: mapSlices("stockByCategory"),
    moneyFlowThisMonth: mapSlices("moneyFlowThisMonth"),
    topSellingItems,
    lowStockItems,
    recentActivity,
    alerts,
  };
}
