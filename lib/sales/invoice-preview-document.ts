import type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";
import {
  BILLBOOK_LINES,
  GST_ROWS,
  LINES,
  normalizeGstRow,
  SUMMARY_ROWS,
  type BillbookLine,
  type InvoiceGstRow,
  type InvoicePreviewProps,
  type SampleLine,
} from "@/lib/sales/invoice-preview-data";
import type { InvoicePreviewDocument } from "@/lib/sales/invoice-preview-document-types";

export type { InvoicePreviewDocument, LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";

const SAMPLE = {
  businessAddress: "Bazarpara patna, Baikunthpur, Chhattisgarh, 497331",
  businessGstin: "22FGDPS5345Q1ZS",
  businessPhone: "9399576767",
  invoiceNumber: "AABBCCDD/202",
  invoiceDate: "17/01/2023",
  invoiceDateWithTime: "17/01/2023, 02:30 PM",
  dueDate: "16/02/2023",
  partyName: "SAMPLE PARTY",
  partyAddress: "No F2, Outer Circle, Connaught Circus,\nNew Delhi, DELHI, 110001",
  partyGstin: "07ABCCH2702H4ZZ",
  partyPhone: "7400417400",
  placeOfSupply: "Karnataka",
  shippingAddress: "1234123 324324234,\nBengaluru,",
  totalDisc: "1,051.43",
  totalTax: "1,724.57",
  totalAmount: "9,596.5",
  receivedAmount: "0",
  previousBalance: "-1,92,050.15",
  currentBalance: "-1,82,453.65",
  amountInWords: "Nine Thousand Five Hundred Ninety Six Rupees and Fifty Paise",
  notes: "Sample Note",
  terms:
    "NOTE:- IF ALL THE GOODS ARE DEFECTIVE, THE SERVICE CENTER WILL BE MADE FROM SERVICE CENTER, THERE WILL BE NO RESPOSSIBILITY FOR THE STORE. ALL DISPUTES ARE SUBJECT TO LOCAL JURISDICTION ONLY. E. & O.E.",
  bankDetails: "",
} as const;

export type ResolvedInvoicePreview = {
  businessAddress: string;
  businessTaxLine: string;
  businessPhone: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  partyName: string;
  partyAddress: string;
  partyTaxLine: string;
  partyPhone: string;
  placeOfSupply: string;
  shippingAddress: string;
  lines: SampleLine[];
  billbookLines: BillbookLine[];
  gstRows: InvoiceGstRow[];
  summaryRows: Array<{ label: string; value: string; bold?: boolean }>;
  totalDisc: string;
  totalTax: string;
  totalAmount: string;
  receivedAmount: string;
  previousBalance: string;
  currentBalance: string;
  amountInWords: string;
  notes: string;
  terms: string;
  bankDetails: string;
  documentTitle: string;
  dueDateLabel: string;
  hidePaymentSummary: boolean;
};

function stripRupee(value: string): string {
  return value.replace(/₹\s*/g, "").trim();
}

function toSampleLine(line: LiveInvoicePreviewModel["lines"][number]): SampleLine {
  return {
    name: line.name,
    desc: line.description ?? "",
    ...(line.serialLabel ? { serial: line.serialLabel } : {}),
    hsn: line.hsn,
    qty: line.qtyLabel,
    rate: line.rate,
    disc: line.discount,
    discSub: line.discountSub,
    tax: line.tax,
    taxSub: line.taxSub,
    amount: line.amount,
  };
}

function toBillbookLine(line: SampleLine): BillbookLine {
  return {
    name: line.name,
    desc: line.desc,
    ...(line.serial ? { serial: line.serial } : {}),
    qty: line.qty,
    rate: line.rate,
    disc: line.disc,
    discSub: line.discSub,
    amount: line.amount,
  };
}

export function mapLivePreviewToDocument(model: LiveInvoicePreviewModel): InvoicePreviewDocument {
  const lines = model.lines.map(toSampleLine);
  const billbookLines = lines.map(toBillbookLine);

  return {
    businessAddress: model.businessAddress,
    businessTaxLine: model.businessTaxLine,
    businessPhone: model.businessPhone,
    invoiceNumber: model.displayNumber,
    invoiceDate: model.invoiceDate,
    dueDate: model.dueDate ?? "",
    partyName: model.partyName,
    partyAddress: model.partyAddress ?? "",
    partyTaxLine: model.partyTaxLine ?? "",
    partyPhone: model.partyPhone ?? "",
    placeOfSupply: model.placeOfSupply,
    shippingAddress: model.shippingAddress ?? "",
    partyBalance: model.partyBalance ? stripRupee(model.partyBalance) : undefined,
    lines,
    billbookLines,
    gstRows: model.gstRows,
    summaryRows: model.summaryRows.map((row) => ({
      label: row.label,
      value: stripRupee(row.value),
      bold: row.bold,
    })),
    totalDisc: model.totalDisc,
    totalTax: model.totalTax,
    totalAmount: stripRupee(model.totalAmount),
    receivedAmount: stripRupee(model.amountReceived),
    previousBalance: model.partyBalance ? stripRupee(model.partyBalance) : "0",
    currentBalance: stripRupee(model.balanceAmount),
    amountInWords: model.amountInWords,
    notes: model.notes ?? "",
    terms: model.terms ?? "",
    bankDetails: model.bankLabel ?? "",
  };
}

export function resolveInvoicePreviewContent(props: InvoicePreviewProps): ResolvedInvoicePreview {
  const doc = props.document;
  const hasLive = Boolean(doc?.lines?.length);

  const lines = hasLive && doc?.lines?.length ? doc.lines : LINES;
  const billbookLines =
    hasLive && doc?.billbookLines?.length ? doc.billbookLines : BILLBOOK_LINES;

  const invoiceDate = hasLive
    ? `${doc?.invoiceDate ?? SAMPLE.invoiceDate}${props.showTimeOnInvoice ? ", 12:00 PM" : ""}`
    : props.showTimeOnInvoice
      ? SAMPLE.invoiceDateWithTime
      : SAMPLE.invoiceDate;

  const summaryRows =
    hasLive && doc?.summaryRows?.length
      ? doc.summaryRows
      : SUMMARY_ROWS.map((row) => ({ label: row.label, value: row.value, bold: row.bold }));

  const totalAmount = hasLive ? (doc?.totalAmount ?? SAMPLE.totalAmount) : SAMPLE.totalAmount;
  const receivedAmount = hasLive
    ? (doc?.receivedAmount ?? SAMPLE.receivedAmount)
    : SAMPLE.receivedAmount;
  const previousBalance = hasLive
    ? (doc?.previousBalance ?? SAMPLE.previousBalance)
    : SAMPLE.previousBalance;
  const currentBalance = props.showPartyBalance
    ? hasLive
      ? (doc?.currentBalance ?? SAMPLE.currentBalance)
      : SAMPLE.currentBalance
    : totalAmount;

  const org = props.organisation;

  return {
    businessAddress: hasLive
      ? (doc?.businessAddress ?? "")
      : (org?.businessAddress ?? SAMPLE.businessAddress),
    businessTaxLine: hasLive
      ? (doc?.businessTaxLine ?? "")
      : (org?.businessTaxLine ?? `GSTIN: ${SAMPLE.businessGstin}`),
    businessPhone: hasLive
      ? (doc?.businessPhone ?? "")
      : (org?.businessPhone ?? SAMPLE.businessPhone),
    invoiceNumber: doc?.invoiceNumber ?? SAMPLE.invoiceNumber,
    invoiceDate,
    dueDate: doc?.dueDate ?? SAMPLE.dueDate,
    partyName: doc?.partyName ?? SAMPLE.partyName,
    partyAddress: hasLive
      ? (doc?.partyAddress ?? "")
      : SAMPLE.partyAddress.replace(/\n/g, ", "),
    partyTaxLine: hasLive
      ? (doc?.partyTaxLine ?? "")
      : `GSTIN: ${SAMPLE.partyGstin}`,
    partyPhone: hasLive ? (doc?.partyPhone ?? "") : SAMPLE.partyPhone,
    placeOfSupply: hasLive
      ? (doc?.placeOfSupply ?? "")
      : (org?.placeOfSupply ?? SAMPLE.placeOfSupply),
    shippingAddress: hasLive
      ? (doc?.shippingAddress ?? "")
      : SAMPLE.shippingAddress.replace(/\n/g, ", "),
    lines,
    billbookLines,
    gstRows:
      hasLive && doc?.gstRows?.length
        ? doc.gstRows.map((row) => normalizeGstRow(row))
        : GST_ROWS,
    summaryRows,
    totalDisc: doc?.totalDisc ?? SAMPLE.totalDisc,
    totalTax: doc?.totalTax ?? SAMPLE.totalTax,
    totalAmount,
    receivedAmount,
    previousBalance,
    currentBalance,
    amountInWords: doc?.amountInWords ?? SAMPLE.amountInWords,
    notes: doc?.notes ?? SAMPLE.notes,
    terms: doc?.terms ?? SAMPLE.terms,
    bankDetails: doc?.bankDetails ?? SAMPLE.bankDetails,
    documentTitle: doc?.documentTitle ?? "TAX INVOICE",
    dueDateLabel: doc?.dueDateLabel ?? "Due Date",
    hidePaymentSummary: doc?.hidePaymentSummary ?? false,
  };
}
