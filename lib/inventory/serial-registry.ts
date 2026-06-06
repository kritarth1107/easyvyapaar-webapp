import type { InventoryItemDetail, InventorySerialNumber } from "@/lib/types/inventory-api";

export type SerialStatus = InventorySerialNumber["status"];

export type SerialRecord = {
  id: string;
  serialNumber: string;
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  status: SerialStatus;
  dateAdded: string;
  purchasePrice: number;
  salePrice: number;
  unit: string;
};

export function buildSerialRegistry(items: InventoryItemDetail[]): SerialRecord[] {
  const records: SerialRecord[] = [];

  for (const item of items) {
    if (!item.serialised) continue;
    for (const row of item.serialNumbers) {
      records.push({
        id: `${item.itemId}::${row.serialNumber}`,
        serialNumber: row.serialNumber,
        itemId: item.itemId,
        itemName: item.name,
        sku: item.itemCode,
        category: item.categoryName,
        status: row.status,
        dateAdded: row.dateCreated,
        purchasePrice: item.purchasePrice,
        salePrice: item.salesPrice,
        unit: item.unit,
      });
    }
  }

  return records.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
}

export function getSerializedItems(items: InventoryItemDetail[]): InventoryItemDetail[] {
  return items.filter((item) => item.serialised);
}
