import {
  getLineItemQtyUsedElsewhere,
  getSerialsUsedElsewhere,
  type InvoiceLineItem,
} from "@/lib/sales/create-invoice-form";
import type { InventoryItem } from "@/lib/types/inventory-ui";

export type PosSearchRow =
  | { type: "item"; item: InventoryItem }
  | { type: "serial"; item: InventoryItem; serialNumber: string };

export function posSearchRowKey(row: PosSearchRow): string {
  return row.type === "serial" ? `${row.item.id}::${row.serialNumber}` : row.item.id;
}

export function expandPosSearchRows(
  items: InventoryItem[],
  lineItems: InvoiceLineItem[],
): PosSearchRow[] {
  const rows: PosSearchRow[] = [];
  for (const item of items) {
    if (item.serialised) {
      const used = getSerialsUsedElsewhere(lineItems, item.id);
      for (const serialNumber of item.availableSerials ?? []) {
        if (!used.has(serialNumber)) {
          rows.push({ type: "serial", item, serialNumber });
        }
      }
    } else {
      const used = getLineItemQtyUsedElsewhere(lineItems, item.id);
      if (Math.max(0, item.stock - used) > 0) {
        rows.push({ type: "item", item });
      }
    }
  }
  return rows;
}

export function inventoryItemIsBillable(item: InventoryItem): boolean {
  if (item.serialised) {
    return (item.availableSerials?.length ?? 0) > 0;
  }
  return item.stock > 0;
}
