import type { CreateInvoiceFormState, InvoiceLineItem } from "@/lib/sales/create-invoice-form";
import { createInitialInvoiceForm } from "@/lib/sales/create-invoice-form";
import { normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import {
  normalizeThemeId,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import { storedSettingsToInvoiceSettings } from "@/lib/sales/map-stored-invoice-settings";
import type { InventoryItemDetail } from "@/lib/types/inventory-api";
import type { QuotationDetail } from "@/lib/types/quotations-api";

function daysBetween(start: string, end: string): number {
  const startMs = new Date(`${start}T12:00:00`).getTime();
  const endMs = new Date(`${end}T12:00:00`).getTime();
  return Math.max(0, Math.round((endMs - startMs) / 86_400_000));
}

function mapLineItem(
  line: QuotationDetail["lineItems"][number],
  itemDetail?: InventoryItemDetail,
): InvoiceLineItem {
  const serialised = Boolean(line.serialNumbers?.length) || Boolean(itemDetail?.serialised);
  const inStockSerials =
    itemDetail?.serialNumbers
      .filter((row) => row.status === "in_stock")
      .map((row) => row.serialNumber) ?? [];
  const lineSerials = line.serialNumbers ?? [];
  const availableSerials = [...new Set([...inStockSerials, ...lineSerials])];

  return {
    id: line.lineId,
    itemId: line.itemId,
    name: line.name,
    hsn: line.hsn,
    qty: line.qty,
    unit: line.unit,
    pricePerItem: line.pricePerItem,
    discount: line.discount,
    discountType: line.discountType,
    gstPercent: line.gstPercent,
    salesTaxMode: normalizeSalesTaxMode(line.salesTaxMode),
    availableStock: Math.max(itemDetail?.currentStock ?? line.qty, line.qty),
    serialised,
    serialNumbers: lineSerials,
    availableSerials,
    ...(line.supplierId ? { supplierId: line.supplierId } : {}),
    ...(line.supplierName ? { supplierName: line.supplierName } : {}),
  };
}

export function mapQuotationDetailToFormState(
  quotation: QuotationDetail,
  itemDetails: Map<string, InventoryItemDetail>,
  storedSettings?: StoredSalesInvoiceSettings | null,
): CreateInvoiceFormState {
  const base = createInitialInvoiceForm();
  const settings = storedSettings
    ? storedSettingsToInvoiceSettings(storedSettings)
    : base.settings;

  const paymentTermsDays = quotation.validUntil
    ? daysBetween(quotation.quotationDate, quotation.validUntil)
    : base.paymentTermsDays;

  return {
    ...base,
    partyId: quotation.partyId ?? null,
    invoicePrefix: quotation.quotationPrefix,
    invoiceNumber: quotation.quotationNumber,
    invoiceDate: quotation.quotationDate,
    paymentTermsDays,
    dueDate: quotation.validUntil ?? base.dueDate,
    showPaymentTerms: Boolean(quotation.validUntil),
    lineItems: quotation.lineItems.map((line) =>
      mapLineItem(line, itemDetails.get(line.itemId)),
    ),
    notes: quotation.notes ?? "",
    terms: quotation.terms ?? "",
    showNotes: Boolean(quotation.notes?.trim()),
    showTerms: Boolean(quotation.terms?.trim()),
    showBankAccount: Boolean(quotation.bankAccount),
    bankAccountId: quotation.bankAccount?.bankAccountId ?? null,
    additionalCharges: quotation.additionalCharges.map((charge) => ({
      id: charge.chargeId,
      label: charge.label,
      amount: charge.amount,
      taxPercent: charge.taxPercent,
    })),
    discountAfterTax: quotation.discountAfterTax,
    discountType: quotation.discountType,
    discountTiming: quotation.discountTiming,
    autoRoundOff: quotation.autoRoundOff,
    roundOffAmount: quotation.roundOffAmount,
    settings: {
      ...settings,
      theme: normalizeThemeId(quotation.theme),
    },
  };
}
