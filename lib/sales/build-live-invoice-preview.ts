import {
  calcInvoiceTotals,
  calcLineItem,
  formatDisplayDate,
  formatInr,
  type AdditionalCharge,
  type CreateInvoiceFormState,
  type InvoiceLineItem,
} from "@/lib/sales/create-invoice-form";
import type { InvoiceGstRow } from "@/lib/sales/invoice-preview-data";
import type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";
import { getInvoiceLineDisplay, normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import {
  formatGstinOrPanLine,
  type InvoiceOrganisationSnapshot,
} from "@/lib/sales/invoice-preview-formatters";
import type { StoredSalesInvoiceSettings } from "@/lib/sales/invoice-settings-config";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
import type { SalesInvoiceDetail } from "@/lib/types/sales-api";
import type { SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";

export type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";

type BuildPreviewInput = {
  form: CreateInvoiceFormState;
  party: SelectedInvoiceParty | null;
  businessName: string;
  organisation: InvoiceOrganisationSnapshot;
  bankAccount?: OrganisationBankAccount | null;
  storedSettings: StoredSalesInvoiceSettings;
};

function formatPlainInr(amount: number): string {
  return formatInr(amount).replace(/₹\s*/g, "").trim();
}

function formatQty(qty: number, unit: string) {
  return `${qty}${unit ? ` ${unit}` : ""}`;
}

function formatDiscountDisplay(
  discount: number,
  discountType: "percent" | "amount",
  discountDisplay: number,
  exclusiveBase: number,
) {
  if (discount <= 0 || discountDisplay <= 0) return { label: "0", sub: "(0%)" };
  if (discountType === "percent") {
    return { label: formatPlainInr(discountDisplay), sub: `(${discount}%)` };
  }
  const pct = exclusiveBase > 0 ? Math.round((discountDisplay / exclusiveBase) * 100) : 0;
  return { label: formatPlainInr(discountDisplay), sub: `(${pct}%)` };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildGstRowsFromStored(
  lineItems: Array<{
    hsn: string;
    gstPercent: number;
    taxable: number;
    tax: number;
  }>,
  additionalCharges: Array<{ amount: number; taxPercent: number }>,
  taxRatio: number,
): InvoiceGstRow[] {
  const groups = new Map<
    string,
    { hsn: string; taxable: number; tax: number; gstPercent: number }
  >();

  for (const line of lineItems) {
    const hsn = line.hsn?.trim() || "—";
    const key = `${hsn}-${line.gstPercent}`;
    const current = groups.get(key) ?? {
      hsn,
      taxable: 0,
      tax: 0,
      gstPercent: line.gstPercent,
    };
    current.taxable = roundMoney(current.taxable + line.taxable * taxRatio);
    current.tax = roundMoney(current.tax + line.tax * taxRatio);
    groups.set(key, current);
  }

  for (const charge of additionalCharges) {
    if (charge.taxPercent <= 0 || charge.amount <= 0) continue;
    const hsn = "—";
    const key = `${hsn}-${charge.taxPercent}`;
    const tax = roundMoney(charge.amount * (charge.taxPercent / 100) * taxRatio);
    const current = groups.get(key) ?? {
      hsn,
      taxable: 0,
      tax: 0,
      gstPercent: charge.taxPercent,
    };
    current.taxable = roundMoney(current.taxable + charge.amount * taxRatio);
    current.tax = roundMoney(current.tax + tax);
    groups.set(key, current);
  }

  return [...groups.values()].map((row) => {
    const cgst = roundMoney(row.tax / 2);
    const sgst = roundMoney(row.tax - cgst);
    const halfRate = row.gstPercent > 0 ? `${row.gstPercent / 2}%` : "0%";
    return {
      hsn: row.hsn,
      taxable: formatPlainInr(row.taxable),
      cgstRate: halfRate,
      cgst: formatPlainInr(cgst),
      sgstRate: halfRate,
      sgst: formatPlainInr(sgst),
      tax: formatPlainInr(row.tax),
    };
  });
}

function buildGstRows(
  lineItems: InvoiceLineItem[],
  additionalCharges: AdditionalCharge[],
  taxRatio: number,
): InvoiceGstRow[] {
  const groups = new Map<
    string,
    { hsn: string; taxable: number; tax: number; gstPercent: number }
  >();

  for (const line of lineItems) {
    const calc = calcLineItem(line);
    const hsn = line.hsn?.trim() || "—";
    const key = `${hsn}-${line.gstPercent}`;
    const current = groups.get(key) ?? {
      hsn,
      taxable: 0,
      tax: 0,
      gstPercent: line.gstPercent,
    };
    current.taxable = roundMoney(current.taxable + calc.taxable * taxRatio);
    current.tax = roundMoney(current.tax + calc.tax * taxRatio);
    groups.set(key, current);
  }

  for (const charge of additionalCharges) {
    if (charge.taxPercent <= 0 || charge.amount <= 0) continue;
    const hsn = "—";
    const key = `${hsn}-${charge.taxPercent}`;
    const tax = roundMoney(charge.amount * (charge.taxPercent / 100) * taxRatio);
    const current = groups.get(key) ?? {
      hsn,
      taxable: 0,
      tax: 0,
      gstPercent: charge.taxPercent,
    };
    current.taxable = roundMoney(current.taxable + charge.amount * taxRatio);
    current.tax = roundMoney(current.tax + tax);
    groups.set(key, current);
  }

  return [...groups.values()].map((row) => {
    const cgst = roundMoney(row.tax / 2);
    const sgst = roundMoney(row.tax - cgst);
    const halfRate = row.gstPercent > 0 ? `${row.gstPercent / 2}%` : "0%";
    return {
      hsn: row.hsn,
      taxable: formatPlainInr(row.taxable),
      cgstRate: halfRate,
      cgst: formatPlainInr(cgst),
      sgstRate: halfRate,
      sgst: formatPlainInr(sgst),
      tax: formatPlainInr(row.tax),
    };
  });
}

function buildLinesFromForm(form: CreateInvoiceFormState) {
  let totalDisc = 0;
  let totalTax = 0;

  const lines = form.lineItems.map((line) => {
    const salesTaxMode = normalizeSalesTaxMode(line.salesTaxMode);
    const display = getInvoiceLineDisplay({
      qty: line.qty,
      pricePerItem: line.pricePerItem,
      discount: line.discount,
      discountType: line.discountType,
      gstPercent: line.gstPercent,
      salesTaxMode,
    });
    totalDisc += display.discountDisplay;
    totalTax += display.tax;
    const exclusiveBase = display.unitRateExcl * line.qty;
    const disc = formatDiscountDisplay(
      line.discount,
      line.discountType,
      display.discountDisplay,
      exclusiveBase,
    );
    return {
      name: line.name,
      hsn: line.hsn || "—",
      qtyLabel: formatQty(line.qty, line.unit),
      rate: formatPlainInr(display.unitRateExcl),
      discount: disc.label,
      discountSub: disc.sub,
      tax: formatPlainInr(display.tax),
      taxSub: `(${line.gstPercent}%)`,
      amount: formatPlainInr(display.amount),
      ...(line.serialNumbers.length ? { serialLabel: line.serialNumbers.join(", ") } : {}),
    };
  });

  return { lines, totalDisc, totalTax };
}

function calcStoredLineDiscountDisplay(line: SalesInvoiceDetail["lineItems"][number]): number {
  const grossInput = roundMoney(line.qty * line.pricePerItem);
  if (line.discount <= 0 || grossInput <= 0) return 0;
  const raw =
    line.discountType === "percent"
      ? grossInput * (line.discount / 100)
      : Math.min(line.discount, grossInput);
  return roundMoney(Math.min(raw, grossInput));
}

function buildLinesFromDetail(invoice: SalesInvoiceDetail) {
  let totalDisc = 0;

  const lines = invoice.lineItems.map((line) => {
    const discountDisplay = calcStoredLineDiscountDisplay(line);
    totalDisc += discountDisplay;
    const unitRateExcl = line.qty > 0 ? roundMoney(line.taxable / line.qty) : 0;
    const exclusiveBase = line.taxable + discountDisplay;
    const disc = formatDiscountDisplay(
      line.discount,
      line.discountType,
      discountDisplay,
      exclusiveBase,
    );
    return {
      name: line.name,
      hsn: line.hsn || "—",
      qtyLabel: formatQty(line.qty, line.unit),
      rate: formatPlainInr(unitRateExcl),
      discount: disc.label,
      discountSub: disc.sub,
      tax: formatPlainInr(line.tax),
      taxSub: `(${line.gstPercent}%)`,
      amount: formatPlainInr(line.amount),
      ...(line.serialNumbers?.length ? { serialLabel: line.serialNumbers.join(", ") } : {}),
    };
  });

  return { lines, totalDisc, totalTax: invoice.lineTax + invoice.additionalChargesTax };
}

function amountInWordsPlaceholder(amount: number): string {
  return `${formatPlainInr(amount)} Rupees Only`;
}

export function buildLiveInvoicePreviewModel({
  form,
  party,
  businessName,
  organisation,
  bankAccount,
  storedSettings,
}: BuildPreviewInput): LiveInvoicePreviewModel {
  const totals = calcInvoiceTotals(form);
  const received = form.fullyPaid ? totals.totalAmount : form.amountReceived;
  const { lines, totalDisc, totalTax } = buildLinesFromForm(form);

  const isGstInvoice = form.invoiceType === "gst_invoice";
  const partyName = party?.name ?? (form.cashSaleDefault ? "Cash / Walk-in Customer" : "—");
  const partyTaxLine =
    isGstInvoice && party ? formatGstinOrPanLine(party.gstin, party.pan) : "";

  const termsText =
    form.showTerms && form.terms.trim()
      ? form.terms.trim()
      : storedSettings.termsText.trim() || undefined;

  const bankLabel =
    form.showBankAccount && bankAccount
      ? [
          bankAccount.bankName,
          bankAccount.accountNumber,
          bankAccount.ifscCode ? `IFSC: ${bankAccount.ifscCode}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  const grossTaxable = totals.subtotal + totals.additionalChargesTotal;
  const summaryRows: LiveInvoicePreviewModel["summaryRows"] = [
    {
      label: "Taxable Amount",
      value: formatPlainInr(
        form.discountTiming === "before_tax" && totals.discountAmount > 0
          ? grossTaxable
          : totals.taxableAmount,
      ),
    },
    ...(form.discountTiming === "before_tax" && totals.discountAmount > 0
      ? [
          {
            label: "Discount (Before Tax)",
            value: `-${formatPlainInr(totals.discountAmount)}`,
          },
          { label: "Net Taxable Amount", value: formatPlainInr(totals.taxableAmount) },
        ]
      : []),
    ...(form.discountTiming === "after_tax" && totals.discountAmount > 0
      ? [{ label: "Discount (After Tax)", value: `-${formatPlainInr(totals.discountAmount)}` }]
      : []),
    ...(totals.roundOff !== 0 ? [{ label: "Round Off", value: formatPlainInr(totals.roundOff) }] : []),
    { label: "Total Amount", value: formatPlainInr(totals.totalAmount), bold: true },
    { label: "Received Amount", value: formatPlainInr(received) },
  ];

  return {
    businessName,
    businessAddress: organisation.businessAddress,
    businessTaxLine: organisation.businessTaxLine,
    businessPhone: organisation.businessPhone,
    placeOfSupply:
      isGstInvoice && party?.placeOfSupply?.trim()
        ? party.placeOfSupply.trim()
        : organisation.placeOfSupply,
    displayNumber: `${form.invoicePrefix}${form.invoiceNumber}`,
    invoiceDate: formatDisplayDate(form.invoiceDate),
    ...(form.showPaymentTerms && form.dueDate ? { dueDate: formatDisplayDate(form.dueDate) } : {}),
    partyName,
    ...(party?.billingAddress?.trim() ? { partyAddress: party.billingAddress.trim() } : {}),
    ...(partyTaxLine ? { partyTaxLine } : {}),
    ...(party?.phone?.trim() ? { partyPhone: party.phone.trim() } : {}),
    ...(party?.shippingAddress?.trim() ? { shippingAddress: party.shippingAddress.trim() } : {}),
    ...(storedSettings.showPartyBalance && party && !party.isCashSale
      ? { partyBalance: formatInr(party.balance) }
      : {}),
    lines,
    gstRows: buildGstRows(
      form.lineItems,
      form.additionalCharges,
      grossTaxable > 0 && form.discountTiming === "before_tax" && totals.discountAmount > 0
        ? totals.taxableAmount / grossTaxable
        : 1,
    ),
    totalDisc: formatPlainInr(totalDisc),
    totalTax: formatPlainInr(totals.taxTotal),
    totalAmount: formatPlainInr(totals.totalAmount),
    amountInWords: amountInWordsPlaceholder(totals.totalAmount),
    ...(form.showNotes && form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(termsText ? { terms: termsText } : {}),
    ...(bankLabel ? { bankLabel } : {}),
    summaryRows,
    amountReceived: formatInr(received),
    balanceAmount: formatInr(totals.balanceAmount),
    paymentMode: form.paymentMode.charAt(0).toUpperCase() + form.paymentMode.slice(1),
  };
}

export function buildLiveInvoicePreviewFromDetail(
  invoice: SalesInvoiceDetail,
  businessName: string,
  organisation: InvoiceOrganisationSnapshot,
  party?: SelectedInvoiceParty | null,
): LiveInvoicePreviewModel {
  const { lines, totalDisc, totalTax } = buildLinesFromDetail(invoice);

  const bank = invoice.bankAccount;
  const bankLabel = bank
    ? [bank.bankName, bank.accountNumber, bank.ifscCode ? `IFSC: ${bank.ifscCode}` : ""]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const grossTaxable = invoice.subtotal + invoice.additionalChargesTotal;
  const taxRatio = grossTaxable > 0 ? invoice.taxableAmount / grossTaxable : 1;

  const summaryRows: LiveInvoicePreviewModel["summaryRows"] = [
    {
      label: "Taxable Amount",
      value: formatPlainInr(
        invoice.discountTiming === "before_tax" && invoice.discountAmount > 0
          ? grossTaxable
          : invoice.taxableAmount,
      ),
    },
    ...(invoice.discountTiming === "before_tax" && invoice.discountAmount > 0
      ? [
          {
            label: "Discount (Before Tax)",
            value: `-${formatPlainInr(invoice.discountAmount)}`,
          },
          { label: "Net Taxable Amount", value: formatPlainInr(invoice.taxableAmount) },
        ]
      : []),
    ...(invoice.discountTiming === "after_tax" && invoice.discountAmount > 0
      ? [{ label: "Discount (After Tax)", value: `-${formatPlainInr(invoice.discountAmount)}` }]
      : []),
    ...(invoice.roundOffAmount !== 0
      ? [{ label: "Round Off", value: formatPlainInr(invoice.roundOffAmount) }]
      : []),
    { label: "Total Amount", value: formatPlainInr(invoice.totalAmount), bold: true },
    { label: "Received Amount", value: formatPlainInr(invoice.amountReceived) },
  ];

  const gstRows = buildGstRowsFromStored(invoice.lineItems, invoice.additionalCharges, taxRatio);

  const invoiceType = invoice.invoiceType ?? "cash_memo";
  const partyTaxLine =
    invoiceType === "gst_invoice"
      ? formatGstinOrPanLine(invoice.partyGstin ?? party?.gstin, party?.pan)
      : "";

  return {
    businessName,
    businessAddress: organisation.businessAddress,
    businessTaxLine: organisation.businessTaxLine,
    businessPhone: organisation.businessPhone,
    placeOfSupply:
      invoiceType === "gst_invoice"
        ? (invoice.placeOfSupply?.trim() ||
            party?.placeOfSupply?.trim() ||
            organisation.placeOfSupply)
        : organisation.placeOfSupply,
    displayNumber: invoice.displayNumber,
    invoiceDate: formatDisplayDate(invoice.invoiceDate),
    ...(invoice.dueDate ? { dueDate: formatDisplayDate(invoice.dueDate) } : {}),
    partyName: invoice.partyName,
    ...(party?.billingAddress?.trim() ? { partyAddress: party.billingAddress.trim() } : {}),
    ...(partyTaxLine ? { partyTaxLine } : {}),
    ...(invoice.partyPhone?.trim() ? { partyPhone: invoice.partyPhone.trim() } : party?.phone?.trim() ? { partyPhone: party.phone.trim() } : {}),
    ...(party?.shippingAddress?.trim() ? { shippingAddress: party.shippingAddress.trim() } : {}),
    lines,
    gstRows,
    totalDisc: formatPlainInr(totalDisc),
    totalTax: formatPlainInr(invoice.lineTax + invoice.additionalChargesTax),
    totalAmount: formatPlainInr(invoice.totalAmount),
    amountInWords: amountInWordsPlaceholder(invoice.totalAmount),
    ...(invoice.notes ? { notes: invoice.notes } : {}),
    ...(invoice.terms ? { terms: invoice.terms } : {}),
    ...(bankLabel ? { bankLabel } : {}),
    summaryRows,
    amountReceived: formatInr(invoice.amountReceived),
    balanceAmount: formatInr(invoice.balanceAmount),
    paymentMode: invoice.paymentMode.charAt(0).toUpperCase() + invoice.paymentMode.slice(1),
    documentTitle: invoiceType === "gst_invoice" ? "TAX INVOICE" : "CASH MEMO",
  };
}
