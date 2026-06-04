/** Mock shop dashboard payload — replace with real API when wired */

export type ShopDashboardStats = {
  organisationId: string;
  salesToday: number;
  salesTodayDelta: number;
  invoicesToday: number;
  toCollect: number;
  toPay: number;
  lowStockCount: number;
  pendingOrders: number;
  weeklySales: { day: string; amount: number }[];
  recentActivity: { id: string; label: string; time: string; amount?: string }[];
  alerts: { id: string; type: "warning" | "info"; message: string }[];
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function seedFromOrgId(orgId: string): number {
  let h = 0;
  for (let i = 0; i < orgId.length; i++) h = (h + orgId.charCodeAt(i) * (i + 1)) % 997;
  return h;
}

export async function fetchShopDashboardStats(
  organisationId: string
): Promise<ShopDashboardStats> {
  // Simulates BFF round-trip for stats, parties snapshot, stock, etc.
  await new Promise((r) => setTimeout(r, 900 + (seedFromOrgId(organisationId) % 400)));

  const s = seedFromOrgId(organisationId);
  const base = 12000 + (s % 80) * 850;

  return {
    organisationId,
    salesToday: base + (s % 12) * 420,
    salesTodayDelta: ((s % 7) - 3) * 2.4,
    invoicesToday: 8 + (s % 15),
    toCollect: 45000 + (s % 50) * 1200,
    toPay: 18000 + (s % 30) * 600,
    lowStockCount: 3 + (s % 8),
    pendingOrders: 2 + (s % 5),
    weeklySales: DAY_LABELS.map((day, i) => ({
      day,
      amount: Math.round(base * (0.45 + ((s + i * 13) % 40) / 100)),
    })),
    recentActivity: [
      {
        id: "1",
        label: "GST Invoice #ME-2401",
        time: "12 min ago",
        amount: `₹${(4200 + (s % 9) * 310).toLocaleString("en-IN")}`,
      },
      {
        id: "2",
        label: "Payment received — Rahul Traders",
        time: "1 hr ago",
        amount: `₹${(8000 + (s % 5) * 500).toLocaleString("en-IN")}`,
      },
      {
        id: "3",
        label: "Stock adjusted — Samsung A15",
        time: "2 hr ago",
      },
      {
        id: "4",
        label: "Purchase bill #PB-882",
        time: "Today, 9:40 AM",
        amount: `₹${(15600 + (s % 4) * 900).toLocaleString("en-IN")}`,
      },
    ],
    alerts: [
      {
        id: "a1",
        type: "warning",
        message: `${3 + (s % 4)} items below low-stock threshold`,
      },
      {
        id: "a2",
        type: "warning",
        message: `${2 + (s % 3)} invoices overdue for collection`,
      },
      {
        id: "a3",
        type: "info",
        message: "GSTR-1 filing due in 6 days",
      },
    ],
  };
}
