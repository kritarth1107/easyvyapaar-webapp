import type { InventoryItemDetail } from "@/lib/types/inventory-api";
export type ItemType = "product" | "service";
export type TaxMode = "with_tax" | "without_tax";

export type CreateItemSection =
  | "basic"
  | "serial"
  | "stock"
  | "pricing"
  | "suppliers"
  | "party"
  | "custom";

export type SerialNumberRow = {
  id: string;
  serialNumber: string;
  dateCreated: string;
};

export type PartyPriceRow = {
  id: string;
  partyName: string;
  price: string;
};

export type CustomFieldRow = {
  id: string;
  label: string;
  value: string;
};

export type PurchaseSupplierRow = {
  id: string;
  partyId: string;
};

export type CreateItemFormState = {
  itemType: ItemType;
  categoryId: string;
  name: string;
  showInOnlineStore: boolean;
  salesPrice: string;
  salesTaxMode: TaxMode;
  purchasePrice: string;
  purchaseTaxMode: TaxMode;
  gstRate: string;
  salesDiscountPercent: string;
  unit: string;
  openingStock: string;
  serialised: boolean;
  serialNumbers: SerialNumberRow[];
  itemCode: string;
  hsn: string;
  asOfDate: string;
  lowStockWarning: boolean;
  lowStockQty: string;
  description: string;
  partyPrices: PartyPriceRow[];
  purchaseSuppliers: PurchaseSupplierRow[];
  customFields: CustomFieldRow[];
};

export const GST_RATE_OPTIONS = ["none", "0", "5", "10", "12", "18", "28"] as const;

export const UNIT_OPTIONS = [
  "PCS",
  "KG",
  "GM",
  "LTR",
  "ML",
  "BOX",
  "PKT",
  "MTR",
  "SQM",
  "NOS",
] as const;

export function normalizeUnitName(name: string): string {
  return name.trim().toUpperCase();
}

export function getInitialUnitList(extra: string[] = []): string[] {
  const set = new Set<string>([
    ...UNIT_OPTIONS,
    ...extra.map(normalizeUnitName).filter(Boolean),
  ]);
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export const DEFAULT_CATEGORY_OPTIONS = [
  "AC",
  "ADJUST",
  "Accessories",
  "Appliances",
  "Electronics",
  "General",
  "Grocery",
  "Hardware",
  "Mobiles",
  "OVEN MICROWAVE",
  "Other",
  "PURIFICATION",
] as const;

export function getInitialCategoryList(extra: string[] = []): string[] {
  const set = new Set<string>([...DEFAULT_CATEGORY_OPTIONS, ...extra]);
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function formatSerialDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function createSerialRow(serialNumber = "", dateCreated = todayIso()): SerialNumberRow {
  return { id: String(Date.now()) + Math.random().toString(36).slice(2, 6), serialNumber, dateCreated };
}

export function parsePastedSerials(text: string): string[] {
  return text
    .split(/[\n\r\t,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createInitialItemForm(): CreateItemFormState {
  return {
    itemType: "product",
    categoryId: "",
    name: "",
    showInOnlineStore: false,
    salesPrice: "",
    salesTaxMode: "with_tax",
    purchasePrice: "",
    purchaseTaxMode: "with_tax",
    gstRate: "none",
    salesDiscountPercent: "",
    unit: "PCS",
    openingStock: "",
    serialised: false,
    serialNumbers: [],
    itemCode: "",
    hsn: "",
    asOfDate: todayIso(),
    lowStockWarning: false,
    lowStockQty: "",
    description: "",
    partyPrices: [
      { id: "1", partyName: "", price: "" },
      { id: "2", partyName: "", price: "" },
    ],
    purchaseSuppliers: [{ id: "1", partyId: "" }],
    customFields: [
      { id: "1", label: "", value: "" },
      { id: "2", label: "", value: "" },
    ],
  };
}

/** Numeric item code from current Unix time (seconds). */
export function generateItemCode(): string {
  return String(Math.floor(Date.now() / 1000));
}

export function formFromInventoryItemDetail(item: InventoryItemDetail): CreateItemFormState {
  return {
    itemType: item.itemType === "service" ? "service" : "product",
    categoryId: item.categoryId || "",
    name: item.name || "",
    showInOnlineStore: Boolean(item.showInOnlineStore),
    salesPrice: item.salesPrice != null ? String(item.salesPrice) : "",
    salesTaxMode: item.salesTaxMode === "without_tax" ? "without_tax" : "with_tax",
    purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
    purchaseTaxMode: item.purchaseTaxMode === "without_tax" ? "without_tax" : "with_tax",
    gstRate: item.gstRate || "none",
    salesDiscountPercent:
      item.salesDiscountPercent != null ? String(item.salesDiscountPercent) : "",
    unit: item.unit || "PCS",
    openingStock: item.openingStock != null ? String(item.openingStock) : "",
    serialised: Boolean(item.serialised),
    serialNumbers: (item.serialNumbers ?? []).map((row) =>
      createSerialRow(row.serialNumber, row.dateCreated?.slice(0, 10) || undefined),
    ),
    itemCode: item.itemCode || "",
    hsn: item.hsn || "",
    asOfDate: item.asOfDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    lowStockWarning: Boolean(item.lowStockWarning),
    lowStockQty: item.lowStockQty != null ? String(item.lowStockQty) : "",
    description: item.description || "",
    partyPrices: (item.partyPrices ?? []).map((row) => ({
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      partyName: row.partyId,
      price: String(row.price ?? ""),
    })),
    purchaseSuppliers: (item.purchaseSuppliers ?? []).map((row) => ({
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      partyId: row.partyId,
    })),
    customFields: (item.customFields ?? []).map((row) => ({
      id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
      label: row.field,
      value: row.value,
    })),
  };
}
