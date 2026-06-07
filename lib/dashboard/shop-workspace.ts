import { normalizeDashboardOverview } from "@/lib/api/dashboard";

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DashboardSlice = {
  id: string;
  label: string;
  amount: number;
  count?: number;
};

export type ShopDashboardStats = {
  organisationId: string;
  generatedAt: string;
  salesToday: number;
  salesYesterday: number;
  salesTodayDelta: number;
  invoicesToday: number;
  salesThisMonth: number;
  purchasesThisMonth: number;
  expensesThisMonth: number;
  profitEstimateThisMonth: number;
  cashInHand: number;
  totalBankBalance: number;
  totalCashBalance: number;
  toCollect: number;
  toPay: number;
  netOutstanding: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalItems: number;
  totalStockValue: number;
  totalRetailValue: number;
  pendingPurchaseOrders: number;
  overdueInvoicesCount: number;
  weeklySales: { date: string; dayKey: WeekdayKey; amount: number; invoiceCount: number }[];
  monthlyTrend: {
    monthKey: string;
    monthLabel: string;
    sales: number;
    purchases: number;
    expenses: number;
  }[];
  salesByPaymentMode: DashboardSlice[];
  stockByCategory: DashboardSlice[];
  moneyFlowThisMonth: DashboardSlice[];
  topSellingItems: { itemId: string; name: string; qty: number; revenue: number }[];
  lowStockItems: {
    itemId: string;
    name: string;
    currentStock: number;
    lowStockQty: number;
    unit: string;
  }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    amount?: number;
    date: string;
    referenceId?: string;
  }[];
  alerts: {
    id: string;
    type: "warning" | "info";
    message: string;
    count?: number;
    href?: string;
  }[];
};

export async function fetchShopDashboardStats(
  organisationId: string,
): Promise<ShopDashboardStats> {
  const res = await fetch(
    `/api/dashboard/overview?organisationId=${encodeURIComponent(organisationId)}`,
    { cache: "no-store" },
  );
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Failed to load dashboard";
    throw new Error(message);
  }
  const data = normalizeDashboardOverview(body);
  if (!data) throw new Error("Invalid dashboard response");
  return data;
}
