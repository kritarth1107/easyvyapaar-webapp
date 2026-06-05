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
    itemsBodyMinH: 100,
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

export const GST_ROWS = [
  { hsn: "2032", taxable: "1,800", rate: "5%", tax: "90" },
  { hsn: "40511209", taxable: "291.43", rate: "5%", tax: "14.57" },
  { hsn: "1234", taxable: "9,000", rate: "18%", tax: "1,620" },
];

export const SUMMARY_ROWS = [
  { label: "Taxable Amount", value: "11,091.43", bold: false },
  { label: "IGST @5%", value: "104.57", bold: false },
  { label: "IGST @18%", value: "1,620", bold: false },
  { label: "Total Amount", value: "9,596.5", bold: true },
  { label: "Received Amount", value: "0", bold: false },
] as const;

export function fmtRupee(n: string) {
  return `₹ ${n}`;
}

export type InvoicePreviewProps = {
  businessName: string;
  accentHex: string;
  showPartyBalance: boolean;
  showPhoneOnInvoice: boolean;
  showItemDescription: boolean;
  showTimeOnInvoice: boolean;
  enableReceiverSignature: boolean;
  signatureImageUrl: string | null;
};
