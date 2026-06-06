import { INDUSTRY_TYPE_OPTIONS } from "@/lib/constants/industry-types";

export type InvoiceThemeId =
  | "gst-advance-a4"
  | "gst-advance-a5"
  | "billbook-a4"
  | "billbook-a5"
  | "modern"
  | "simple";

export type ThemeColorId =
  | "sky"
  | "mint"
  | "peach"
  | "rose"
  | "lavender"
  | "lemon"
  | "aqua"
  | "grey";

export const INVOICE_THEME_CARDS: { id: InvoiceThemeId; label: string }[] = [
  { id: "gst-advance-a4", label: "GST Advance A4" },
  { id: "gst-advance-a5", label: "GST Advance (A5)" },
  { id: "billbook-a4", label: "Billbook A4" },
  { id: "billbook-a5", label: "Billbook (A5)" },
  { id: "modern", label: "Modern" },
  { id: "simple", label: "Simple" },
];

export const THEME_COLOR_SWATCHES: { id: ThemeColorId; hex: string; label: string }[] = [
  { id: "sky", hex: "#dbeafe", label: "Sky blue" },
  { id: "mint", hex: "#d1fae5", label: "Mint" },
  { id: "peach", hex: "#ffedd5", label: "Peach" },
  { id: "rose", hex: "#ffe4e6", label: "Rose" },
  { id: "lavender", hex: "#ede9fe", label: "Lavender" },
  { id: "lemon", hex: "#fef9c3", label: "Lemon" },
  { id: "aqua", hex: "#cffafe", label: "Aqua" },
  { id: "grey", hex: "#f3f4f6", label: "Grey" },
];

const LEGACY_ACCENT_COLOR_MAP: Record<string, ThemeColorId> = {
  black: "grey",
  sand: "grey",
  olive: "mint",
  blue: "sky",
  navy: "sky",
  red: "rose",
  indigo: "lavender",
  gold: "lemon",
  brown: "peach",
};

export const INDUSTRY_TYPES = INDUSTRY_TYPE_OPTIONS;

export const PAYMENT_QR_OPTIONS = [
  { value: "", label: "Select Payment QR" },
  { value: "upi-1", label: "7047896266@YBL" },
  { value: "upi-2", label: "shop@paytm" },
];

export const TERMS_PRESETS = [
  { value: "sales", label: "Sales Invoices" },
  { value: "quotation", label: "Quotations" },
  { value: "custom", label: "Custom" },
];

export type FullInvoiceSettings = {
  themeId: InvoiceThemeId;
  accentColor: ThemeColorId;
  showPartyBalance: boolean;
  enableFreeQty: boolean;
  showItemDescription: boolean;
  showAlternateUnit: boolean;
  showPhoneOnInvoice: boolean;
  showTimeOnInvoice: boolean;
  priceHistory: boolean;
  industryType: string;
  showPoNumber: boolean;
  showEwayBill: boolean;
  showVehicleNumber: boolean;
  partyCustomField: string;
  itemColumns: {
    price: boolean;
    quantity: boolean;
    batchNo: boolean;
    expDate: boolean;
    mfgDate: boolean;
  };
  paymentQr: string;
  termsPreset: string;
  termsText: string;
  signatureSource: "desktop" | "draw";
  signatureDataUrl: string | null;
  enableReceiverSignature: boolean;
};

export const DEFAULT_FULL_INVOICE_SETTINGS: FullInvoiceSettings = {
  themeId: "gst-advance-a4",
  accentColor: "grey",
  showPartyBalance: true,
  enableFreeQty: true,
  showItemDescription: false,
  showAlternateUnit: false,
  showPhoneOnInvoice: true,
  showTimeOnInvoice: false,
  priceHistory: false,
  industryType: "MOBILE_ACCESSORIES",
  showPoNumber: false,
  showEwayBill: false,
  showVehicleNumber: false,
  partyCustomField: "",
  itemColumns: {
    price: true,
    quantity: true,
    batchNo: false,
    expDate: false,
    mfgDate: false,
  },
  paymentQr: "",
  termsPreset: "sales",
  termsText: "",
  signatureSource: "desktop",
  signatureDataUrl: null,
  enableReceiverSignature: false,
};

/** Full settings page + quick-create-invoice modal toggles persisted per organisation. */
export type StoredSalesInvoiceSettings = FullInvoiceSettings & {
  showPrefixSequence: boolean;
  showPurchasePrice: boolean;
  showItemImage: boolean;
};

export const DEFAULT_STORED_SALES_INVOICE_SETTINGS: StoredSalesInvoiceSettings = {
  ...DEFAULT_FULL_INVOICE_SETTINGS,
  showPrefixSequence: true,
  showPurchasePrice: true,
  showItemImage: false,
};

const LEGACY_THEME_ID_MAP: Record<string, InvoiceThemeId> = {
  "advanced-gst": "gst-advance-a4",
  luxury: "modern",
  stylish: "modern",
  classic: "simple",
  bold: "simple",
  compact: "billbook-a5",
  retail: "billbook-a4",
};

export type InvoicePrintPageSize = "a4" | "a5";

export function resolveInvoicePageSizeFromTheme(themeId: InvoiceThemeId | string): InvoicePrintPageSize {
  const normalized = normalizeThemeId(themeId);
  return normalized === "gst-advance-a5" || normalized === "billbook-a5" ? "a5" : "a4";
}

export function normalizeThemeId(themeId: string): InvoiceThemeId {
  if (LEGACY_THEME_ID_MAP[themeId]) {
    return LEGACY_THEME_ID_MAP[themeId];
  }
  if (INVOICE_THEME_CARDS.some((t) => t.id === themeId)) {
    return themeId as InvoiceThemeId;
  }
  return "gst-advance-a4";
}

export function normalizeAccentColor(colorId: string): ThemeColorId {
  if (THEME_COLOR_SWATCHES.some((c) => c.id === colorId)) {
    return colorId as ThemeColorId;
  }
  return LEGACY_ACCENT_COLOR_MAP[colorId] ?? "grey";
}

export function getAccentHex(colorId: ThemeColorId | string): string {
  const normalized = normalizeAccentColor(colorId);
  return THEME_COLOR_SWATCHES.find((c) => c.id === normalized)?.hex ?? "#f3f4f6";
}

/** Text color that reads on invoice table header backgrounds */
export function getHeaderTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#111111" : "#ffffff";
}
