import type { InventoryItem } from "@/lib/dashboard/mock-inventory-items";

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
};

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
  discountAmount: number;
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
  const base = item.qty * item.pricePerItem;
  const discountAmt =
    item.discountType === "percent" ? base * (item.discount / 100) : item.discount;
  const taxable = Math.max(0, base - discountAmt);
  const tax = taxable * (item.gstPercent / 100);
  const amount = taxable + tax;
  return { base, discountAmt, taxable, tax, amount };
}

export function calcInvoiceTotals(form: CreateInvoiceFormState): InvoiceTotals {
  const lineCalcs = form.lineItems.map(calcLineItem);
  const subtotal = lineCalcs.reduce((s, c) => s + c.taxable, 0);
  const lineTax = lineCalcs.reduce((s, c) => s + c.tax, 0);

  let additionalChargesTotal = 0;
  let additionalChargesTax = 0;
  for (const ch of form.additionalCharges) {
    additionalChargesTotal += ch.amount;
    additionalChargesTax += ch.amount * (ch.taxPercent / 100);
  }

  const taxableAmount = subtotal + additionalChargesTotal;
  const taxTotal = lineTax + additionalChargesTax;
  const gross = taxableAmount + taxTotal;

  const discountAmount =
    form.discountType === "percent"
      ? gross * (form.discountAfterTax / 100)
      : form.discountAfterTax;

  const totalBeforeRound = Math.max(0, gross - discountAmount);
  let roundOff = 0;
  let totalAmount = totalBeforeRound;

  if (form.autoRoundOff) {
    const rounded = Math.round(totalBeforeRound);
    roundOff = rounded - totalBeforeRound;
    totalAmount = rounded;
  } else if (form.roundOffAmount !== 0) {
    roundOff = form.roundOffAmount;
    totalAmount = totalBeforeRound + roundOff;
  }

  const received = form.fullyPaid ? totalAmount : form.amountReceived;
  const balanceAmount = Math.max(0, totalAmount - received);

  return {
    subtotal,
    lineTax,
    additionalChargesTotal,
    additionalChargesTax,
    taxableAmount,
    discountAmount,
    totalBeforeRound,
    roundOff,
    totalAmount,
    balanceAmount,
  };
}

export function lineItemFromInventory(item: InventoryItem): InvoiceLineItem {
  return {
    id: `line-${item.id}-${Date.now()}`,
    itemId: item.id,
    name: item.name,
    hsn: item.hsn,
    qty: 1,
    unit: item.unit,
    pricePerItem: item.salePrice,
    discount: 0,
    discountType: "percent",
    gstPercent: item.gstPercent,
  };
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
