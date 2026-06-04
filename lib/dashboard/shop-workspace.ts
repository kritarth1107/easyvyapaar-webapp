/** Mock shop dashboard payload — replace with real API when wired */

import type { TranslationKey } from "@/lib/localization";

export type ShopDashboardStats = {
  organisationId: string;
  salesToday: number;
  salesTodayDelta: number;
  invoicesToday: number;
  toCollect: number;
  toPay: number;
  lowStockCount: number;
  pendingOrders: number;
  weeklySales: { dayKey: WeekdayKey; amount: number }[];
  recentActivity: {
    id: string;
    labelKey: TranslationKey;
    timeKey: TranslationKey;
    amount?: string;
  }[];
  alerts: {
    id: string;
    type: "warning" | "info";
    messageKey: TranslationKey;
    count?: number;
  }[];
};

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const WEEKDAY_KEYS: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function seedFromOrgId(orgId: string): number {
  let h = 0;
  for (let i = 0; i < orgId.length; i++) h = (h + orgId.charCodeAt(i) * (i + 1)) % 997;
  return h;
}

export async function fetchShopDashboardStats(
  organisationId: string
): Promise<ShopDashboardStats> {
  await new Promise((r) => setTimeout(r, 900 + (seedFromOrgId(organisationId) % 400)));

  const s = seedFromOrgId(organisationId);
  const base = 12000 + (s % 80) * 850;
  const lowStockCount = 3 + (s % 4);
  const overdueCount = 2 + (s % 3);

  return {
    organisationId,
    salesToday: base + (s % 12) * 420,
    salesTodayDelta: ((s % 7) - 3) * 2.4,
    invoicesToday: 8 + (s % 15),
    toCollect: 45000 + (s % 50) * 1200,
    toPay: 18000 + (s % 30) * 600,
    lowStockCount: 3 + (s % 8),
    pendingOrders: 2 + (s % 5),
    weeklySales: WEEKDAY_KEYS.map((dayKey, i) => ({
      dayKey,
      amount: Math.round(base * (0.45 + ((s + i * 13) % 40) / 100)),
    })),
    recentActivity: [
      {
        id: "1",
        labelKey: "dashboard.activity.invoice",
        timeKey: "dashboard.activity.time12min",
        amount: `₹${(4200 + (s % 9) * 310).toLocaleString("en-IN")}`,
      },
      {
        id: "2",
        labelKey: "dashboard.activity.paymentReceived",
        timeKey: "dashboard.activity.time1hr",
        amount: `₹${(8000 + (s % 5) * 500).toLocaleString("en-IN")}`,
      },
      {
        id: "3",
        labelKey: "dashboard.activity.stockAdjusted",
        timeKey: "dashboard.activity.time2hr",
      },
      {
        id: "4",
        labelKey: "dashboard.activity.purchaseBill",
        timeKey: "dashboard.activity.timeToday940",
        amount: `₹${(15600 + (s % 4) * 900).toLocaleString("en-IN")}`,
      },
    ],
    alerts: [
      {
        id: "a1",
        type: "warning",
        messageKey: "dashboard.alerts.lowStock",
        count: lowStockCount,
      },
      {
        id: "a2",
        type: "warning",
        messageKey: "dashboard.alerts.overdueInvoices",
        count: overdueCount,
      },
      {
        id: "a3",
        type: "info",
        messageKey: "dashboard.alerts.gstr1Due",
      },
    ],
  };
}
