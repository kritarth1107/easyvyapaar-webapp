import type { CreateInvoiceFormState, InvoiceLineItem } from "@/lib/sales/create-invoice-form";
import { createInitialInvoiceForm } from "@/lib/sales/create-invoice-form";
import { normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import { normalizeThemeId, type StoredSalesInvoiceSettings } from "@/lib/sales/invoice-settings-config";
import { storedSettingsToInvoiceSettings } from "@/lib/sales/map-stored-invoice-settings";
import { WALK_IN_PARTY_ID } from "@/lib/parties/constants";
import type { InventoryItemDetail } from "@/lib/types/inventory-api";
import type { SalesInvoiceDetail } from "@/lib/types/sales-api";

/**
 * Client-side pre-check for invoice edit; the backend is authoritative (422 with a reason).
 * Editable = not cancelled, nothing received, no active IRN, no live E-Way Bill, no returns.
 */
export function isSalesInvoiceEditable(invoice: SalesInvoiceDetail): boolean {
  return (
    invoice.status === "unpaid" &&
    invoice.amountReceived <= 0 &&
    !(invoice.irn && invoice.eInvoiceStatus !== "cancelled") &&
    !(invoice.ewayBillNo && invoice.eWayBillStatus !== "cancelled")
  );
}

function mapLine(line: SalesInvoiceDetail["lineItems"][number], itemDetail?: InventoryItemDetail): InvoiceLineItem {
  const lineSerials = line.serialNumbers ?? [];
  const inStock =
    itemDetail?.serialNumbers.filter((row) => row.status === "in_stock").map((row) => row.serialNumber) ?? [];
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
    // The invoice already holds this stock, so it is available to the edit on top of current stock.
    availableStock: (itemDetail?.currentStock ?? 0) + line.qty,
    serialised: lineSerials.length > 0 || Boolean(itemDetail?.serialised),
    serialNumbers: lineSerials,
    availableSerials: [...new Set([...inStock, ...lineSerials])],
    ...(line.supplierId ? { supplierId: line.supplierId } : {}),
    ...(line.supplierName ? { supplierName: line.supplierName } : {}),
  };
}

export function mapSalesInvoiceDetailToFormState(
  invoice: SalesInvoiceDetail,
  itemDetails: Map<string, InventoryItemDetail>,
  storedSettings?: StoredSalesInvoiceSettings | null,
): CreateInvoiceFormState {
  const base = createInitialInvoiceForm();
  const settings = storedSettings ? storedSettingsToInvoiceSettings(storedSettings) : base.settings;
  return {
    ...base,
    partyId: invoice.isCashSale ? WALK_IN_PARTY_ID : (invoice.partyId ?? null),
    invoiceType: invoice.invoiceType,
    cashSaleDefault: invoice.isCashSale,
    invoicePrefix: invoice.invoicePrefix,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.slice(0, 10),
    paymentTermsDays: invoice.paymentTermsDays,
    dueDate: invoice.dueDate?.slice(0, 10) ?? base.dueDate,
    showPaymentTerms: Boolean(invoice.dueDate),
    lineItems: invoice.lineItems.map((line) => mapLine(line, itemDetails.get(line.itemId))),
    notes: invoice.notes ?? "",
    terms: invoice.terms ?? "",
    showNotes: Boolean(invoice.notes?.trim()),
    showTerms: Boolean(invoice.terms?.trim()),
    showBankAccount: Boolean(invoice.bankAccount),
    bankAccountId: invoice.bankAccount?.bankAccountId ?? null,
    additionalCharges: invoice.additionalCharges.map((charge) => ({
      id: charge.chargeId,
      label: charge.label,
      amount: charge.amount,
      taxPercent: charge.taxPercent,
    })),
    discountAfterTax: invoice.discountAfterTax,
    discountType: invoice.discountType,
    discountTiming: invoice.discountTiming,
    autoRoundOff: invoice.autoRoundOff,
    roundOffAmount: invoice.roundOffAmount,
    amountReceived: invoice.amountReceived,
    paymentMode: invoice.paymentMode || base.paymentMode,
    fullyPaid: false,
    settings: { ...settings, theme: normalizeThemeId(invoice.theme) },
  };
}
