export type ItemType = "product" | "service";
export type TaxMode = "with_tax" | "without_tax";

export type CreateItemSection =
  | "basic"
  | "serial"
  | "stock"
  | "pricing"
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

export type CreateItemFormState = {
  itemType: ItemType;
  category: string;
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
    category: "",
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
