import { MOCK_INVENTORY_ITEMS } from "@/lib/dashboard/mock-inventory-items";

export type SerialStatus = "in_stock" | "sold" | "returned" | "damaged" | "reserved";

export type SerialRecord = {
  id: string;
  serialNumber: string;
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  status: SerialStatus;
  dateAdded: string;
  dateSold?: string;
  godown: string;
  partyName?: string;
  purchasePrice: number;
  salePrice: number;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildSerialsForItem(
  itemId: string,
  prefix: string,
  count: number,
  soldCount: number,
  damagedCount = 0
): SerialRecord[] {
  const item = MOCK_INVENTORY_ITEMS.find((i) => i.id === itemId);
  if (!item) return [];

  const records: SerialRecord[] = [];
  for (let i = 1; i <= count; i++) {
    const num = String(356789012345600 + i * 17 + Number(itemId) * 1000).slice(0, 15);
    let status: SerialStatus = "in_stock";
    let dateSold: string | undefined;
    let partyName: string | undefined;

    if (i <= soldCount) {
      status = "sold";
      dateSold = daysAgo(3 + (i % 12));
      partyName = i % 2 === 0 ? "Rahul Mobiles" : "Sharma Electronics";
    } else if (i <= soldCount + damagedCount) {
      status = "damaged";
    } else if (i === count && count > 4) {
      status = "reserved";
      partyName = "Pending invoice #1042";
    }

    records.push({
      id: `${itemId}-s${i}`,
      serialNumber: `${prefix}${num}`,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      category: item.category,
      status,
      dateAdded: daysAgo(20 + (i % 45)),
      dateSold,
      godown: i % 3 === 0 ? "Warehouse B" : "Main store",
      partyName,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
    });
  }
  return records;
}

/** Flat registry of IMEI/serial numbers across serialized SKUs. */
export const MOCK_SERIAL_RECORDS: SerialRecord[] = [
  ...buildSerialsForItem("1", "IMEI", 24, 4, 1),
  ...buildSerialsForItem("3", "SN", 5, 1),
  ...buildSerialsForItem("6", "IMEI", 9, 2),
];

export function getSerializedInventoryItems() {
  return MOCK_INVENTORY_ITEMS.filter((i) => i.serialised);
}
