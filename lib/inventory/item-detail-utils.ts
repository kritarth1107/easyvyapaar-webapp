import type { InventoryItemStatus } from "@/lib/types/inventory-ui";
import type { InventoryItemDetail } from "@/lib/types/inventory-api";

export function computeDetailStockStatus(
  item: Pick<InventoryItemDetail, "currentStock" | "lowStockWarning" | "lowStockQty">,
): InventoryItemStatus {
  if (item.currentStock <= 0) return "out_of_stock";
  if (item.lowStockWarning && item.lowStockQty > 0 && item.currentStock <= item.lowStockQty) {
    return "low_stock";
  }
  return "in_stock";
}

export function formatGstRateLabel(gstRate: string): string {
  if (!gstRate || gstRate === "none") return "0%";
  return `${gstRate}%`;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDetailDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
