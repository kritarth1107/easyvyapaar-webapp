import type { InvoicePreviewDocument } from "@/lib/sales/invoice-preview-document-types";
import type { InvoiceOrganisationSnapshot } from "@/lib/sales/invoice-preview-formatters";

/** @ 96dpi */
export const A4_WIDTH = 794;
export const A4_MIN_HEIGHT = 1123;
/** A5 @ 96dpi */
export const A5_WIDTH = 794;
export const A5_MIN_HEIGHT = 559;

export type InvoicePageSize = "a4" | "a5";

export const PAGE_SIZES: Record<
  InvoicePageSize,
  { width: number; minHeight: number; itemsBodyMinH: number }
> = {
  a4: { width: A4_WIDTH, minHeight: A4_MIN_HEIGHT, itemsBodyMinH: 200 },
  a5: {
    width: A5_WIDTH,
    minHeight: A5_MIN_HEIGHT,
    itemsBodyMinH: 48,
  },
};

export function pageScale(pageSize: InvoicePageSize) {
  return PAGE_SIZES[pageSize].width / A4_WIDTH;
}

export const ITEMS_BODY_MIN_H = 200;

export const COL = {
  sno: "4.5%",
  items: "36%",
  hsn: "9%",
  qty: "7.5%",
  rate: "11%",
  disc: "11%",
  tax: "11%",
  amount: "10%",
} as const;

export type SampleLine = {
  name: string;
  desc: string;
  serial?: string;
  hsn: string;
  qty: string;
  rate: string;
  disc: string;
  discSub: string;
  tax: string;
  taxSub: string;
  amount: string;
};

export type BillbookLine = {
  name: string;
  desc: string;
  serial?: string;
  qty: string;
  rate: string;
  disc: string;
  discSub: string;
  amount: string;
};

export const BILLBOOK_LINES: BillbookLine[] = [
  {
    name: "Samsung A30",
    desc: "samsung phone",
    qty: "1 PCS",
    rate: "11,620",
    disc: "1,000",
    discSub: "(10%)",
    amount: "10,620",
  },
  {
    name: "Parle-G 200g",
    desc: "best biscuit",
    qty: "1 BOX",
    rate: "357.43",
    disc: "51.43",
    discSub: "(15%)",
    amount: "306",
  },
  {
    name: "Puma Blue Round Neck T-Shirt",
    desc: "",
    qty: "2 PCS",
    rate: "945",
    disc: "0",
    discSub: "(0%)",
    amount: "1,890",
  },
];

export const BILLBOOK_COL = {
  sno: "6%",
  items: "42%",
  qty: "10%",
  rate: "14%",
  disc: "14%",
  amount: "14%",
} as const;

export const LINES: SampleLine[] = [
  {
    name: "Samsung A30",
    desc: "samsung phone",
    hsn: "1234",
    qty: "1 PCS",
    rate: "10,000",
    disc: "1,000",
    discSub: "(10%)",
    tax: "1,620",
    taxSub: "(18%)",
    amount: "10,620",
  },
  {
    name: "Parle-G 200g",
    desc: "best biscuit",
    hsn: "40511209",
    qty: "1 BOX",
    rate: "342.86",
    disc: "51.43",
    discSub: "(15%)",
    tax: "14.57",
    taxSub: "(5%)",
    amount: "306",
  },
  {
    name: "Puma Blue Round Neck T-Shirt",
    desc: "",
    hsn: "2032",
    qty: "2 PCS",
    rate: "900",
    disc: "0",
    discSub: "(0%)",
    tax: "90",
    taxSub: "(5%)",
    amount: "1,890",
  },
];

export type InvoiceGstRow = {
  hsn: string;
  taxable: string;
  cgstRate: string;
  cgst: string;
  sgstRate: string;
  sgst: string;
  tax: string;
};

export const GST_ROWS: InvoiceGstRow[] = [
  {
    hsn: "2032",
    taxable: "1,800",
    cgstRate: "2.5%",
    cgst: "45",
    sgstRate: "2.5%",
    sgst: "45",
    tax: "90",
  },
  {
    hsn: "40511209",
    taxable: "291.43",
    cgstRate: "2.5%",
    cgst: "7.29",
    sgstRate: "2.5%",
    sgst: "7.28",
    tax: "14.57",
  },
  {
    hsn: "1234",
    taxable: "9,000",
    cgstRate: "9%",
    cgst: "810",
    sgstRate: "9%",
    sgst: "810",
    tax: "1,620",
  },
];

export const SUMMARY_ROWS = [
  { label: "Taxable Amount", value: "11,091.43", bold: false },
  { label: "CGST (2.5%)", value: "52.57", bold: false },
  { label: "SGST (2.5%)", value: "52.57", bold: false },
  { label: "CGST (9%)", value: "810", bold: false },
  { label: "SGST (9%)", value: "810", bold: false },
  { label: "Total Amount", value: "9,596.5", bold: true },
  { label: "Received Amount", value: "0", bold: false },
] as const;

export function fmtRupee(n: string) {
  return `₹ ${n}`;
}

/** Format summary row values; preserves leading minus for discounts. */
export function fmtSummaryValue(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("-")) return `₹ ${trimmed}`;
  return fmtRupee(trimmed);
}

/** Back-fill CGST/SGST columns when only legacy rate/tax fields exist. */
export function normalizeGstRow(
  row: Partial<InvoiceGstRow> & { hsn: string; taxable: string; tax: string; rate?: string },
): InvoiceGstRow {
  const rateMatch = row.rate?.match(/([\d.]+)/);
  const gstPercent = rateMatch ? Number(rateMatch[1]) : 0;
  const halfRate = gstPercent > 0 ? `${gstPercent / 2}%` : "0%";
  const taxNum = Number(row.tax.replace(/,/g, "")) || 0;
  const cgst =
    row.cgst ??
    (taxNum > 0 ? (Math.round((taxNum / 2) * 100) / 100).toLocaleString("en-IN") : "0");
  const sgst = row.sgst ?? cgst;
  return {
    hsn: row.hsn,
    taxable: row.taxable,
    cgstRate: row.cgstRate ?? halfRate,
    cgst,
    sgstRate: row.sgstRate ?? halfRate,
    sgst,
    tax: row.tax,
  };
}

export function resolveInvoiceLogoUrl(props: {
  logoUrl?: string | null;
  organisation?: { logoUrl?: string };
}): string | null {
  const direct = props.logoUrl?.trim();
  if (direct) return direct;
  const fromOrg = props.organisation?.logoUrl?.trim();
  return fromOrg || null;
}

export type InvoicePreviewProps = {
  businessName: string;
  logoUrl?: string | null;
  accentHex: string;
  showPartyBalance: boolean;
  showPhoneOnInvoice: boolean;
  showItemDescription: boolean;
  showTimeOnInvoice: boolean;
  enableReceiverSignature: boolean;
  signatureImageUrl: string | null;
  /** When set, theme previews render live invoice data instead of sample placeholders. */
  document?: InvoicePreviewDocument;
  /** Org details from business profile — used on settings preview when no live document. */
  organisation?: InvoiceOrganisationSnapshot;
  /** Page view: skip preview card chrome (shadow, outer border, extra padding). */
  embedded?: boolean;
};

export type { InvoicePreviewDocument } from "@/lib/sales/invoice-preview-document-types";
