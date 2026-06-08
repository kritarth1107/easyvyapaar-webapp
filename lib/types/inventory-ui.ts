import type { InventoryItemStockStatus } from "@/lib/types/inventory-api";

export type InventoryItemStatus = InventoryItemStockStatus;

/** Table / billing UI shape mapped from API summaries. */
export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  hsn: string;
  category: string;
  stock: number;
  unit: string;
  salePrice: number;
  purchasePrice: number;
  gstPercent: number;
  salesTaxMode: "with_tax" | "without_tax";
  serialised: boolean;
  status: InventoryItemStatus;
  lowStockWarning?: boolean;
  lowStockQty?: number;
  availableSerials?: string[];
};

export type InventoryBillPick = {
  item: InventoryItem;
  serialNumbers?: string[];
  supplierId?: string;
  supplierName?: string;
};
