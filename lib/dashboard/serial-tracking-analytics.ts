import {
  getSerializedInventoryItems,
  MOCK_SERIAL_RECORDS,
  type SerialRecord,
  type SerialStatus,
} from "@/lib/dashboard/mock-serial-records";
import { MOCK_INVENTORY_ITEMS } from "@/lib/dashboard/mock-inventory-items";

export type SerializedProductRow = {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  stockQty: number;
  serialsRecorded: number;
  inStockSerials: number;
  soldSerials: number;
  match: boolean;
  gap: number;
};

export type SerialTrackingAnalytics = {
  records: SerialRecord[];
  serializedProducts: SerializedProductRow[];
  totals: {
    totalSerials: number;
    inStock: number;
    sold: number;
    returned: number;
    damaged: number;
    reserved: number;
    serializedSkus: number;
    categories: number;
    costValueInStock: number;
    mismatchSkus: number;
  };
  statusSlices: { id: string; label: string; value: number; color: string }[];
  itemSlices: { id: string; label: string; value: number; color: string }[];
  categorySlices: { id: string; label: string; value: number; color: string }[];
  recentAdded: SerialRecord[];
  recentSold: SerialRecord[];
};

const CHART_COLORS = ["#031F49", "#10B981", "#F63E16", "#F59E0B", "#8B5CF6", "#3B82F6", "#64748B"];

const STATUS_COLORS: Record<SerialStatus, string> = {
  in_stock: "#10B981",
  sold: "#031F49",
  returned: "#3B82F6",
  damaged: "#DC2626",
  reserved: "#F59E0B",
};

function buildSlices(
  entries: { id: string; label: string; value: number }[]
): { id: string; label: string; value: number; color: string }[] {
  return entries
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((e, i) => ({
      ...e,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

export function computeSerialTrackingAnalytics(
  records: SerialRecord[] = MOCK_SERIAL_RECORDS
): SerialTrackingAnalytics {
  const statusCounts: Record<SerialStatus, number> = {
    in_stock: 0,
    sold: 0,
    returned: 0,
    damaged: 0,
    reserved: 0,
  };
  for (const r of records) statusCounts[r.status]++;

  const itemMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const r of records) {
    itemMap.set(r.itemId, (itemMap.get(r.itemId) ?? 0) + 1);
    catMap.set(r.category, (catMap.get(r.category) ?? 0) + 1);
  }

  const serializedProducts: SerializedProductRow[] = getSerializedInventoryItems().map((item) => {
    const itemSerials = records.filter((r) => r.itemId === item.id);
    const inStockSerials = itemSerials.filter((r) => r.status === "in_stock").length;
    const soldSerials = itemSerials.filter((r) => r.status === "sold").length;
    const serialsRecorded = itemSerials.length;
    const match = serialsRecorded === item.stock;
    return {
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      category: item.category,
      stockQty: item.stock,
      serialsRecorded,
      inStockSerials,
      soldSerials,
      match,
      gap: item.stock - serialsRecorded,
    };
  });

  const mismatchSkus = serializedProducts.filter((p) => !p.match).length;
  const costValueInStock = records
    .filter((r) => r.status === "in_stock")
    .reduce((s, r) => s + r.purchasePrice, 0);

  const recentAdded = [...records]
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, 5);
  const recentSold = records
    .filter((r) => r.status === "sold" && r.dateSold)
    .sort((a, b) => (b.dateSold ?? "").localeCompare(a.dateSold ?? ""))
    .slice(0, 5);

  return {
    records,
    serializedProducts,
    totals: {
      totalSerials: records.length,
      inStock: statusCounts.in_stock,
      sold: statusCounts.sold,
      returned: statusCounts.returned,
      damaged: statusCounts.damaged,
      reserved: statusCounts.reserved,
      serializedSkus: MOCK_INVENTORY_ITEMS.filter((i) => i.serialised).length,
      categories: new Set(records.map((r) => r.category)).size,
      costValueInStock,
      mismatchSkus,
    },
    statusSlices: Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([id, value]) => ({
        id,
        label: id.replace("_", " "),
        value,
        color: STATUS_COLORS[id as SerialStatus],
      })),
    itemSlices: buildSlices(
      Array.from(itemMap.entries()).map(([id, value]) => {
        const item = MOCK_INVENTORY_ITEMS.find((i) => i.id === id);
        return { id, label: item?.name ?? id, value };
      })
    ),
    categorySlices: buildSlices(
      Array.from(catMap.entries()).map(([label, value]) => ({ id: label, label, value }))
    ),
    recentAdded,
    recentSold,
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
