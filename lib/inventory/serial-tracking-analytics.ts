import type { InventoryItemDetail } from "@/lib/types/inventory-api";
import {
  buildSerialRegistry,
  getSerializedItems,
  type SerialRecord,
  type SerialStatus,
} from "@/lib/inventory/serial-registry";

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
  entries: { id: string; label: string; value: number }[],
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
  items: InventoryItemDetail[],
): SerialTrackingAnalytics {
  const serializedItems = getSerializedItems(items);
  const records = buildSerialRegistry(serializedItems);

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

  const serializedProducts: SerializedProductRow[] = serializedItems.map((item) => {
    const itemSerials = records.filter((r) => r.itemId === item.itemId);
    const inStockSerials = itemSerials.filter((r) => r.status === "in_stock").length;
    const soldSerials = itemSerials.filter((r) => r.status === "sold").length;
    const serialsRecorded = itemSerials.length;
    const match = inStockSerials === item.currentStock;
    return {
      itemId: item.itemId,
      itemName: item.name,
      sku: item.itemCode,
      category: item.categoryName,
      stockQty: item.currentStock,
      serialsRecorded,
      inStockSerials,
      soldSerials,
      match,
      gap: item.currentStock - inStockSerials,
    };
  });

  const mismatchSkus = serializedProducts.filter((p) => !p.match).length;
  const costValueInStock = records
    .filter((r) => r.status === "in_stock")
    .reduce((sum, r) => sum + r.purchasePrice, 0);

  const recentAdded = [...records]
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, 6);
  const recentSold = records
    .filter((r) => r.status === "sold")
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, 6);

  const itemNameById = new Map(serializedItems.map((item) => [item.itemId, item.name]));

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
      serializedSkus: serializedItems.length,
      categories: new Set(records.map((r) => r.category)).size,
      costValueInStock,
      mismatchSkus,
    },
    statusSlices: Object.entries(statusCounts)
      .filter(([, value]) => value > 0)
      .map(([id, value]) => ({
        id,
        label: id.replace(/_/g, " "),
        value,
        color: STATUS_COLORS[id as SerialStatus],
      })),
    itemSlices: buildSlices(
      Array.from(itemMap.entries()).map(([id, value]) => ({
        id,
        label: itemNameById.get(id) ?? id,
        value,
      })),
    ),
    categorySlices: buildSlices(
      Array.from(catMap.entries()).map(([label, value]) => ({ id: label, label, value })),
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

export function exportSerialRegistryCsv(records: SerialRecord[]): void {
  const header = ["Serial", "Item", "SKU", "Category", "Status", "Date added", "Cost", "Sale"];
  const rows = records.map((r) => [
    r.serialNumber,
    r.itemName,
    r.sku,
    r.category,
    r.status,
    r.dateAdded.slice(0, 10),
    String(r.purchasePrice),
    String(r.salePrice),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `serial-registry-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
