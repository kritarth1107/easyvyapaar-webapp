import {
  MOCK_INVENTORY_ITEMS,
  type InventoryItem,
  type InventoryItemStatus,
} from "@/lib/dashboard/mock-inventory-items";

export type AlertPriority = "critical" | "warning" | "watch";

export type LowStockAlertRow = {
  item: InventoryItem;
  reorderLevel: number;
  deficit: number;
  fillPct: number;
  priority: AlertPriority;
  stockValue: number;
  retailAtRisk: number;
  suggestedReorderQty: number;
  daysSinceFlagged: number;
};

export type LowStockAnalytics = {
  lowStockItems: LowStockAlertRow[];
  outOfStockItems: InventoryItem[];
  totals: {
    lowStockCount: number;
    outOfStockCount: number;
    criticalCount: number;
    unitsAtRisk: number;
    costValueAtRisk: number;
    retailAtRisk: number;
    categoriesAffected: number;
    avgFillPct: number;
  };
  categorySlices: { id: string; label: string; value: number; color: string }[];
  byCategory: { category: string; count: number; units: number; deficit: number }[];
};

const CHART_COLORS = ["#F63E16", "#FF6B35", "#F59E0B", "#031F49", "#3B82F6", "#8B5CF6"];

/** Mock reorder thresholds until item master API provides them. */
const REORDER_LEVELS: Record<string, number> = {
  "2": 15,
  "3": 12,
  "5": 8,
};

function defaultReorderLevel(item: InventoryItem): number {
  if (REORDER_LEVELS[item.id] != null) return REORDER_LEVELS[item.id];
  if (item.status === "out_of_stock") return 10;
  return Math.max(item.stock + 7, 10);
}

function priorityFor(item: InventoryItem, fillPct: number): AlertPriority {
  if (item.status === "out_of_stock" || item.stock === 0) return "critical";
  if (fillPct < 35 || item.stock <= 3) return "critical";
  if (fillPct < 60) return "warning";
  return "watch";
}

function seededDays(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return 1 + (h % 14);
}

export function computeLowStockAnalytics(
  items: InventoryItem[] = MOCK_INVENTORY_ITEMS
): LowStockAnalytics {
  const lowStockItems: LowStockAlertRow[] = items
    .filter((i) => i.status === "low_stock")
    .map((item) => {
      const reorderLevel = defaultReorderLevel(item);
      const deficit = Math.max(0, reorderLevel - item.stock);
      const fillPct = reorderLevel > 0 ? Math.min(100, (item.stock / reorderLevel) * 100) : 0;
      const stockValue = item.stock * item.purchasePrice;
      const retailAtRisk = item.stock * item.salePrice;
      return {
        item,
        reorderLevel,
        deficit,
        fillPct,
        priority: priorityFor(item, fillPct),
        stockValue,
        retailAtRisk,
        suggestedReorderQty: Math.max(deficit, Math.ceil(reorderLevel * 0.5)),
        daysSinceFlagged: seededDays(item.id),
      };
    })
    .sort((a, b) => a.fillPct - b.fillPct);

  const outOfStockItems = items.filter((i) => i.status === "out_of_stock");

  const unitsAtRisk = lowStockItems.reduce((s, r) => s + r.item.stock, 0);
  const costValueAtRisk = lowStockItems.reduce((s, r) => s + r.stockValue, 0);
  const retailAtRisk = lowStockItems.reduce((s, r) => s + r.retailAtRisk, 0);
  const criticalCount =
    lowStockItems.filter((r) => r.priority === "critical").length + outOfStockItems.length;

  const catMap = new Map<string, { category: string; count: number; units: number; deficit: number }>();
  for (const row of lowStockItems) {
    const c = row.item.category;
    const prev = catMap.get(c) ?? { category: c, count: 0, units: 0, deficit: 0 };
    prev.count += 1;
    prev.units += row.item.stock;
    prev.deficit += row.deficit;
    catMap.set(c, prev);
  }
  const byCategory = Array.from(catMap.values()).sort((a, b) => b.deficit - a.deficit);

  const categorySlices = byCategory.map((c, i) => ({
    id: c.category,
    label: c.category,
    value: c.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const avgFillPct =
    lowStockItems.length > 0
      ? lowStockItems.reduce((s, r) => s + r.fillPct, 0) / lowStockItems.length
      : 100;

  return {
    lowStockItems,
    outOfStockItems,
    totals: {
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      criticalCount,
      unitsAtRisk,
      costValueAtRisk,
      retailAtRisk,
      categoriesAffected: catMap.size,
      avgFillPct,
    },
    categorySlices,
    byCategory,
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
