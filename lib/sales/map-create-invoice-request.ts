import type { CreateInvoiceFormState } from "@/lib/sales/create-invoice-form";
import { calcInvoiceTotals } from "@/lib/sales/create-invoice-form";
import { normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import type { StoredSalesInvoiceSettings } from "@/lib/sales/invoice-settings-config";
import type { CreateSalesInvoiceRequest } from "@/lib/types/sales-api";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
import { WALK_IN_PARTY_ID } from "@/lib/parties/constants";
import { normalizeGstin } from "@/lib/validators/gstin";

export function mapCreateInvoiceFormToRequest(
  form: CreateInvoiceFormState,
  partyName?: string,
  bankAccount?: OrganisationBankAccount | null,
  storedSettings?: StoredSalesInvoiceSettings | null,
  options?: { partyGstin?: string },
): CreateSalesInvoiceRequest {
  const isGstInvoice = form.invoiceType === "gst_invoice";
  const isCashSale =
    !isGstInvoice &&
    (form.cashSaleDefault || !form.partyId || form.partyId === WALK_IN_PARTY_ID);
  const partyGstin = options?.partyGstin?.trim();
  const totals = calcInvoiceTotals(form);
  const notesText = form.showNotes ? form.notes.trim() : undefined;
  const termsText = form.showTerms
    ? form.terms.trim() || storedSettings?.termsText?.trim() || ""
    : undefined;

  return {
    invoiceType: form.invoiceType,
    isCashSale,
    ...(!isCashSale && form.partyId && form.partyId !== WALK_IN_PARTY_ID
      ? { partyId: form.partyId }
      : {}),
    ...(isCashSale && partyName ? { partyName } : {}),
    ...(isGstInvoice && partyGstin ? { partyGstin: normalizeGstin(partyGstin) } : {}),
    invoicePrefix: form.invoicePrefix.trim(),
    invoiceNumber: form.invoiceNumber.trim(),
    invoiceDate: form.invoiceDate,
    dueDate: form.showPaymentTerms ? form.dueDate : undefined,
    paymentTermsDays: form.paymentTermsDays,
    lineItems: form.lineItems.map((line) => ({
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
      ...(line.serialised && line.serialNumbers.length
        ? { serialNumbers: line.serialNumbers }
        : {}),
      ...(line.supplierId ? { supplierId: line.supplierId } : {}),
      ...(line.supplierName ? { supplierName: line.supplierName } : {}),
    })),
    ...(notesText !== undefined ? { notes: notesText } : {}),
    ...(termsText !== undefined ? { terms: termsText } : {}),
    ...(form.showBankAccount && bankAccount
      ? {
          bankAccount: {
            bankAccountId: bankAccount.bankAccountId,
            accountHolderName: bankAccount.accountHolderName,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            ifscCode: bankAccount.ifscCode,
            branchName: bankAccount.branchName,
          },
        }
      : {}),
    additionalCharges: form.additionalCharges.map((row) => ({
      label: row.label,
      amount: row.amount,
      taxPercent: row.taxPercent,
    })),
    discountAfterTax: form.discountAfterTax,
    discountType: form.discountType,
    discountTiming: form.discountTiming,
    autoRoundOff: form.autoRoundOff,
    roundOffAmount: form.roundOffAmount,
    amountReceived: form.fullyPaid ? totals.totalAmount : form.amountReceived,
    paymentMode: form.paymentMode,
    fullyPaid: form.fullyPaid,
    theme: storedSettings?.themeId ?? form.settings.theme,
  };
}
