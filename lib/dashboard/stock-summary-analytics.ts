import type { InventoryItem, InventoryItemStatus } from "@/lib/types/inventory-ui";

export type NamedSlice = {
  id: string;
  label: string;
  value: number;
  count?: number;
  color: string;
};

export type ItemMetric = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unit: string;
  costValue: number;
  retailValue: number;
  margin: number;
  marginPct: number;
  status: InventoryItemStatus;
};

export type CategoryRow = {
  category: string;
  items: number;
  units: number;
  costValue: number;
  retailValue: number;
  sharePct: number;
};

export type StockSummaryAnalytics = {
  generatedAt: string;
  items: InventoryItem[];
  itemMetrics: ItemMetric[];
  totals: {
    skuCount: number;
    totalUnits: number;
    inStockUnits: number;
    costValue: number;
    retailValue: number;
    grossMargin: number;
    marginPct: number;
    avgUnitsPerSku: number;
    avgCostPerUnit: number;
    avgRetailPerUnit: number;
    serializedSkus: number;
    serializedUnits: number;
    categoryCount: number;
    hsnCount: number;
    unitTypeCount: number;
    zeroStockSkus: number;
    lowStockSkus: number;
    healthySkus: number;
  };
  statusSlices: NamedSlice[];
  categoryValueSlices: NamedSlice[];
  categoryUnitSlices: NamedSlice[];
  gstValueSlices: NamedSlice[];
  unitSlices: NamedSlice[];
  categoryRows: CategoryRow[];
  topByCostValue: ItemMetric[];
  topByUnits: ItemMetric[];
  topByMargin: ItemMetric[];
  lowestStock: ItemMetric[];
  outOfStock: ItemMetric[];
  lowStock: ItemMetric[];
  hsnBreakdown: { hsn: string; items: number; units: number; costValue: number }[];
  weeklyTrend: { day: string; units: number; value: number }[];
  healthScore: number;
  concentration: {
    topCategory: string;
    topCategorySharePct: number;
    top3CategorySharePct: number;
    topItemSharePct: number;
  };
};

const CHART_COLORS = [
  "#031F49",
  "#F63E16",
  "#FF6B35",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#64748B",
];

function itemCostValue(item: InventoryItem): number {
  return item.stock * item.purchasePrice;
}

function itemRetailValue(item: InventoryItem): number {
  return item.stock * item.salePrice;
}

function toMetric(item: InventoryItem): ItemMetric {
  const costValue = itemCostValue(item);
  const retailValue = itemRetailValue(item);
  const margin = retailValue - costValue;
  const marginPct = costValue > 0 ? (margin / costValue) * 100 : 0;
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    stock: item.stock,
    unit: item.unit,
    costValue,
    retailValue,
    margin,
    marginPct,
    status: item.status,
  };
}

function buildSlices(
  entries: { id: string; label: string; value: number; count?: number }[]
): NamedSlice[] {
  return entries
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((e, i) => ({
      ...e,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

function seededTrend(totalUnits: number, totalValue: number) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const baseUnits = Math.max(1, Math.round(totalUnits * 0.85));
  const baseValue = totalValue * 0.88;
  return days.map((day, i) => {
    const wave = 0.92 + Math.sin(i * 1.1) * 0.06 + i * 0.012;
    return {
      day,
      units: Math.round(baseUnits * wave),
      value: Math.round(baseValue * wave),
    };
  });
}

export function computeStockSummaryAnalytics(
  items: InventoryItem[]
): StockSummaryAnalytics {
  const itemMetrics = items.map(toMetric);
  const totalUnits = items.reduce((s, i) => s + i.stock, 0);
  const costValue = items.reduce((s, i) => s + itemCostValue(i), 0);
  const retailValue = items.reduce((s, i) => s + itemRetailValue(i), 0);
  const grossMargin = retailValue - costValue;
  const marginPct = costValue > 0 ? (grossMargin / costValue) * 100 : 0;

  const statusCounts: Record<InventoryItemStatus, number> = {
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
  };
  const statusUnits: Record<InventoryItemStatus, number> = {
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
  };
  for (const item of items) {
    statusCounts[item.status]++;
    statusUnits[item.status] += item.stock;
  }

  const categoryMap = new Map<string, CategoryRow>();
  for (const item of items) {
    const row = categoryMap.get(item.category) ?? {
      category: item.category,
      items: 0,
      units: 0,
      costValue: 0,
      retailValue: 0,
      sharePct: 0,
    };
    row.items += 1;
    row.units += item.stock;
    row.costValue += itemCostValue(item);
    row.retailValue += itemRetailValue(item);
    categoryMap.set(item.category, row);
  }
  const categoryRows = Array.from(categoryMap.values())
    .map((r) => ({
      ...r,
      sharePct: costValue > 0 ? (r.costValue / costValue) * 100 : 0,
    }))
    .sort((a, b) => b.costValue - a.costValue);

  const gstMap = new Map<string, number>();
  const unitMap = new Map<string, number>();
  const hsnMap = new Map<string, { items: number; units: number; costValue: number }>();

  for (const item of items) {
    const gstKey = `${item.gstPercent}%`;
    gstMap.set(gstKey, (gstMap.get(gstKey) ?? 0) + itemCostValue(item));

    unitMap.set(item.unit, (unitMap.get(item.unit) ?? 0) + item.stock);

    const h = hsnMap.get(item.hsn) ?? { items: 0, units: 0, costValue: 0 };
    h.items += 1;
    h.units += item.stock;
    h.costValue += itemCostValue(item);
    hsnMap.set(item.hsn, h);
  }

  const topByCostValue = [...itemMetrics].sort((a, b) => b.costValue - a.costValue);
  const topByUnits = [...itemMetrics].sort((a, b) => b.stock - a.stock);
  const topByMargin = [...itemMetrics]
    .filter((m) => m.costValue > 0)
    .sort((a, b) => b.margin - a.margin);
  const lowestStock = [...itemMetrics]
    .filter((m) => m.stock > 0)
    .sort((a, b) => a.stock - b.stock);
  const outOfStock = itemMetrics.filter((m) => m.status === "out_of_stock");
  const lowStock = itemMetrics.filter((m) => m.status === "low_stock");

  const topCategory = categoryRows[0];
  const top3Share = categoryRows
    .slice(0, 3)
    .reduce((s, r) => s + r.sharePct, 0);
  const topItemSharePct =
    costValue > 0 && topByCostValue[0]
      ? (topByCostValue[0].costValue / costValue) * 100
      : 0;

  const healthySkus = statusCounts.in_stock;
  const healthScore = Math.min(
    100,
    Math.round(
      (healthySkus / Math.max(items.length, 1)) * 40 +
        (1 - outOfStock.length / Math.max(items.length, 1)) * 30 +
        (lowStock.length === 0 ? 20 : Math.max(0, 20 - lowStock.length * 5)) +
        (top3Share < 85 ? 10 : 5)
    )
  );

  return {
    generatedAt: new Date().toISOString(),
    items,
    itemMetrics,
    totals: {
      skuCount: items.length,
      totalUnits,
      inStockUnits: statusUnits.in_stock + statusUnits.low_stock,
      costValue,
      retailValue,
      grossMargin,
      marginPct,
      avgUnitsPerSku: items.length ? totalUnits / items.length : 0,
      avgCostPerUnit: totalUnits ? costValue / totalUnits : 0,
      avgRetailPerUnit: totalUnits ? retailValue / totalUnits : 0,
      serializedSkus: items.filter((i) => i.serialised).length,
      serializedUnits: items.filter((i) => i.serialised).reduce((s, i) => s + i.stock, 0),
      categoryCount: categoryMap.size,
      hsnCount: hsnMap.size,
      unitTypeCount: unitMap.size,
      zeroStockSkus: statusCounts.out_of_stock,
      lowStockSkus: statusCounts.low_stock,
      healthySkus,
    },
    statusSlices: buildSlices([
      { id: "in_stock", label: "In stock", value: statusCounts.in_stock, count: statusUnits.in_stock },
      { id: "low_stock", label: "Low stock", value: statusCounts.low_stock, count: statusUnits.low_stock },
      { id: "out_of_stock", label: "Out of stock", value: statusCounts.out_of_stock, count: statusUnits.out_of_stock },
    ]),
    categoryValueSlices: buildSlices(
      categoryRows.map((r) => ({
        id: r.category,
        label: r.category,
        value: r.costValue,
        count: r.items,
      }))
    ),
    categoryUnitSlices: buildSlices(
      categoryRows.map((r) => ({
        id: r.category,
        label: r.category,
        value: r.units,
        count: r.items,
      }))
    ),
    gstValueSlices: buildSlices(
      Array.from(gstMap.entries()).map(([label, value]) => ({
        id: label,
        label,
        value,
      }))
    ),
    unitSlices: buildSlices(
      Array.from(unitMap.entries()).map(([label, value]) => ({
        id: label,
        label,
        value,
      }))
    ),
    categoryRows,
    topByCostValue: topByCostValue.slice(0, 8),
    topByUnits: topByUnits.slice(0, 8),
    topByMargin: topByMargin.slice(0, 8),
    lowestStock: lowestStock.slice(0, 6),
    outOfStock,
    lowStock,
    hsnBreakdown: Array.from(hsnMap.entries())
      .map(([hsn, data]) => ({ hsn, ...data }))
      .sort((a, b) => b.costValue - a.costValue),
    weeklyTrend: seededTrend(totalUnits, costValue),
    healthScore,
    concentration: {
      topCategory: topCategory?.category ?? "—",
      topCategorySharePct: topCategory?.sharePct ?? 0,
      top3CategorySharePct: top3Share,
      topItemSharePct,
    },
  };
}

export function generateAiStockInsights(a: StockSummaryAnalytics): string[] {
  const insights: string[] = [];
  const { totals, concentration, outOfStock, lowStock } = a;

  insights.push(
    `Your inventory holds ${totals.skuCount} SKUs with ${totals.totalUnits.toLocaleString("en-IN")} total units, worth ${formatInrBrief(totals.costValue)} at purchase cost (without tax).`
  );

  if (concentration.topCategorySharePct >= 40) {
    insights.push(
      `${concentration.topCategory} dominates ${concentration.topCategorySharePct.toFixed(1)}% of stock value — consider diversifying procurement if supply risk is a concern.`
    );
  } else {
    insights.push(
      `Stock value is spread across ${totals.categoryCount} categories; top category ${concentration.topCategory} holds ${concentration.topCategorySharePct.toFixed(1)}% — balanced exposure.`
    );
  }

  if (outOfStock.length > 0) {
    insights.push(
      `${outOfStock.length} SKU(s) are out of stock (${outOfStock.map((i) => i.name).join(", ")}). Restock soon to avoid lost sales.`
    );
  }

  if (lowStock.length > 0) {
    insights.push(
      `${lowStock.length} item(s) are in low-stock status. Set reorder points or enable low-stock alerts on these lines.`
    );
  }

  insights.push(
    `Potential gross margin on hand is ${formatInrBrief(totals.grossMargin)} (${totals.marginPct.toFixed(1)}% on cost) if sold at current sale prices.`
  );

  if (totals.serializedSkus > 0) {
    insights.push(
      `${totals.serializedSkus} serialized SKU(s) track ${totals.serializedUnits} units — ensure IMEI/serial records match physical count during audits.`
    );
  }

  if (a.healthScore >= 75) {
    insights.push(`Overall stock health score is ${a.healthScore}/100 — inventory position looks stable.`);
  } else {
    insights.push(
      `Stock health score is ${a.healthScore}/100 — focus on out-of-stock and low-stock lines to improve availability.`
    );
  }

  const top = a.topByCostValue[0];
  if (top && concentration.topItemSharePct > 25) {
    insights.push(
      `${top.name} alone represents ${concentration.topItemSharePct.toFixed(1)}% of inventory value — monitor this SKU closely.`
    );
  }

  return insights;
}

export function formatInrBrief(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatInrFull(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
