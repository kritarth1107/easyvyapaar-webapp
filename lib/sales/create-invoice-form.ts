import type { InventoryBillPick, InventoryItem } from "@/lib/types/inventory-ui";
import {
  calcInvoiceLevelTotals,
  type InvoiceDiscountTiming,
  type GstSplitRow,
} from "@/lib/sales/invoice-totals";
import {
  calcLineTaxAmounts,
  normalizeSalesTaxMode,
  type SalesTaxMode,
} from "@/lib/sales/invoice-tax";

export type { InvoiceDiscountTiming, GstSplitRow };

export type InvoiceLineItem = {
  id: string;
  itemId: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  pricePerItem: number;
  discount: number;
  discountType: "percent" | "amount";
  gstPercent: number;
  salesTaxMode: SalesTaxMode;
  availableStock: number;
  serialised: boolean;
  serialNumbers: string[];
  availableSerials: string[];
  supplierId?: string;
  supplierName?: string;
};

export function getSerialsUsedElsewhere(
  lineItems: InvoiceLineItem[],
  itemId: string,
  excludeLineId?: string,
): Set<string> {
  const used = new Set<string>();
  for (const line of lineItems) {
    if (line.itemId !== itemId || line.id === excludeLineId) continue;
    for (const serial of line.serialNumbers) used.add(serial);
  }
  return used;
}

export function getFreeSerialsForLine(line: InvoiceLineItem, lineItems: InvoiceLineItem[]): string[] {
  const usedElsewhere = getSerialsUsedElsewhere(lineItems, line.itemId, line.id);
  return line.availableSerials.filter((serial) => !usedElsewhere.has(serial));
}

export function getLineItemQtyUsedElsewhere(
  lineItems: InvoiceLineItem[],
  itemId: string,
  excludeLineId?: string,
): number {
  return lineItems
    .filter((line) => line.itemId === itemId && line.id !== excludeLineId)
    .reduce((sum, line) => sum + (line.serialised ? 1 : line.qty), 0);
}

export function getMaxQtyForLine(line: InvoiceLineItem, lineItems: InvoiceLineItem[]): number {
  const usedElsewhere = getLineItemQtyUsedElsewhere(lineItems, line.itemId, line.id);
  if (line.serialised) {
    return Math.max(0, getFreeSerialsForLine(line, lineItems).length);
  }
  return Math.max(0, line.availableStock - usedElsewhere);
}

export function clampInvoiceLineQty(
  line: InvoiceLineItem,
  nextQty: number,
  lineItems: InvoiceLineItem[],
): number {
  if (line.serialised) return 1;
  const maxQty = getMaxQtyForLine(line, lineItems);
  if (maxQty <= 0) return 0;
  const normalized = Number.isFinite(nextQty) ? Math.floor(nextQty) : 1;
  return Math.min(Math.max(1, normalized), maxQty);
}

export type AdditionalCharge = {
  id: string;
  label: string;
  amount: number;
  taxPercent: number;
};

export type InvoiceSettings = {
  showPrefixSequence: boolean;
  showPurchasePrice: boolean;
  showItemImage: boolean;
  priceHistory: boolean;
  theme: string;
};

export type CreateInvoiceFormState = {
  partyId: string | null;
  cashSaleDefault: boolean;
  invoicePrefix: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentTermsDays: number;
  dueDate: string;
  showPaymentTerms: boolean;
  lineItems: InvoiceLineItem[];
  notes: string;
  terms: string;
  showNotes: boolean;
  showTerms: boolean;
  showBankAccount: boolean;
  bankAccountId: string | null;
  additionalCharges: AdditionalCharge[];
  discountAfterTax: number;
  discountType: "percent" | "amount";
  discountTiming: InvoiceDiscountTiming;
  autoRoundOff: boolean;
  roundOffAmount: number;
  amountReceived: number;
  paymentMode: string;
  fullyPaid: boolean;
  settings: InvoiceSettings;
};

export type LineCalc = {
  base: number;
  discountAmt: number;
  taxable: number;
  tax: number;
  amount: number;
};

export type InvoiceTotals = {
  subtotal: number;
  lineTax: number;
  additionalChargesTotal: number;
  additionalChargesTax: number;
  taxableAmount: number;
  taxTotal: number;
  discountAmount: number;
  discountTiming: InvoiceDiscountTiming;
  cgst: number;
  sgst: number;
  gstSplit: GstSplitRow[];
  totalBeforeRound: number;
  roundOff: number;
  totalAmount: number;
  balanceAmount: number;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calcLineItem(item: InvoiceLineItem): LineCalc {
  return calcLineTaxAmounts({
    qty: item.qty,
    pricePerItem: item.pricePerItem,
    discount: item.discount,
    discountType: item.discountType,
    gstPercent: item.gstPercent,
    salesTaxMode: normalizeSalesTaxMode(item.salesTaxMode),
  });
}

export function calcInvoiceTotals(form: CreateInvoiceFormState): InvoiceTotals {
  return calcInvoiceLevelTotals({
    lineItems: form.lineItems,
    additionalCharges: form.additionalCharges,
    discountValue: form.discountAfterTax,
    discountType: form.discountType,
    discountTiming: form.discountTiming,
    autoRoundOff: form.autoRoundOff,
    roundOffAmount: form.roundOffAmount,
    amountReceived: form.amountReceived,
    fullyPaid: form.fullyPaid,
  });
}

type LineSupplierMeta = {
  supplierId?: string;
  supplierName?: string;
};

export function lineItemFromSerial(
  item: InventoryItem,
  lineItems: InvoiceLineItem[],
  serialNumber: string,
  supplier?: LineSupplierMeta,
): InvoiceLineItem | null {
  const serial = serialNumber.trim();
  if (!serial) return null;

  const usedSerials = getSerialsUsedElsewhere(lineItems, item.id);
  if (usedSerials.has(serial)) return null;

  const availableSerials = item.availableSerials ?? [];
  if (!availableSerials.includes(serial)) return null;

  return {
    id: `line-${item.id}-${serial}-${Date.now()}`,
    itemId: item.id,
    name: item.name,
    hsn: item.hsn,
    qty: 1,
    unit: item.unit,
    pricePerItem: item.salePrice,
    discount: 0,
    discountType: "percent",
    gstPercent: item.gstPercent,
    salesTaxMode: normalizeSalesTaxMode(item.salesTaxMode),
    availableStock: item.stock,
    serialised: true,
    serialNumbers: [serial],
    availableSerials,
    ...(supplier?.supplierId ? { supplierId: supplier.supplierId } : {}),
    ...(supplier?.supplierName ? { supplierName: supplier.supplierName } : {}),
  };
}

export function lineItemFromInventory(
  item: InventoryItem,
  lineItems: InvoiceLineItem[] = [],
  supplier?: LineSupplierMeta,
): InvoiceLineItem | null {
  if (item.serialised) return null;

  const used = getLineItemQtyUsedElsewhere(lineItems, item.id);
  const maxQty = Math.max(0, item.stock - used);
  if (maxQty <= 0) return null;

  return {
    id: `line-${item.id}-${Date.now()}`,
    itemId: item.id,
    name: item.name,
    hsn: item.hsn,
    qty: Math.min(1, maxQty),
    unit: item.unit,
    pricePerItem: item.salePrice,
    discount: 0,
    discountType: "percent",
    gstPercent: item.gstPercent,
    salesTaxMode: normalizeSalesTaxMode(item.salesTaxMode),
    availableStock: item.stock,
    serialised: false,
    serialNumbers: [],
    availableSerials: [],
    ...(supplier?.supplierId ? { supplierId: supplier.supplierId } : {}),
    ...(supplier?.supplierName ? { supplierName: supplier.supplierName } : {}),
  };
}

export function mergeInventoryPickIntoLines(
  lineItems: InvoiceLineItem[],
  pick: InventoryBillPick,
): InvoiceLineItem[] {
  const supplier =
    pick.supplierId
      ? { supplierId: pick.supplierId, ...(pick.supplierName ? { supplierName: pick.supplierName } : {}) }
      : undefined;

  if (pick.item.serialised) {
    let nextLines = lineItems;
    for (const serialNumber of pick.serialNumbers ?? []) {
      const line = lineItemFromSerial(pick.item, nextLines, serialNumber, supplier);
      if (line) nextLines = [...nextLines, line];
    }
    return nextLines;
  }

  const line = lineItemFromInventory(pick.item, lineItems, supplier);
  if (!line) return lineItems;
  return [...lineItems, line];
}

export function createInitialInvoiceForm(): CreateInvoiceFormState {
  const invoiceDate = todayIso();
  return {
    partyId: null,
    cashSaleDefault: false,
    invoicePrefix: "ME/2025-26/",
    invoiceNumber: "1490",
    invoiceDate,
    paymentTermsDays: 30,
    dueDate: addDays(invoiceDate, 30),
    showPaymentTerms: true,
    lineItems: [],
    notes: "",
    terms: "",
    showNotes: false,
    showTerms: false,
    showBankAccount: false,
    bankAccountId: null,
    additionalCharges: [],
    discountAfterTax: 0,
    discountType: "percent",
    discountTiming: "after_tax",
    autoRoundOff: false,
    roundOffAmount: 0,
    amountReceived: 0,
    paymentMode: "cash",
    fullyPaid: false,
    settings: {
      showPrefixSequence: true,
      showPurchasePrice: true,
      showItemImage: false,
      priceHistory: false,
      theme: "gst-advance-a4",
    },
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDisplayDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

export const INVOICE_THEMES = [
  { value: "gst-advance-a4", label: "GST Advance A4" },
  { value: "gst-advance-a5", label: "GST Advance (A5)" },
  { value: "billbook-a4", label: "Billbook A4" },
  { value: "billbook-a5", label: "Billbook (A5)" },
  { value: "modern", label: "Modern" },
  { value: "simple", label: "Simple" },
];
