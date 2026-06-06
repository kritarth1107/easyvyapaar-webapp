import type { CreateInvoiceFormState } from "@/lib/sales/create-invoice-form";
import { normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import type { StoredSalesInvoiceSettings } from "@/lib/sales/invoice-settings-config";
import type {
  CreateQuotationRequest,
  QuotationStatus,
  UpdateQuotationRequest,
} from "@/lib/types/quotations-api";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";

export function mapCreateQuotationFormToRequest(
  form: CreateInvoiceFormState,
  partyId: string,
  bankAccount?: OrganisationBankAccount | null,
  storedSettings?: StoredSalesInvoiceSettings | null,
  options?: { status?: QuotationStatus },
): CreateQuotationRequest {
  const notesText = form.showNotes ? form.notes.trim() : undefined;
  const termsText = form.showTerms
    ? form.terms.trim() || storedSettings?.termsText?.trim() || ""
    : undefined;

  return {
    partyId,
    quotationPrefix: form.invoicePrefix.trim(),
    quotationNumber: form.invoiceNumber.trim(),
    quotationDate: form.invoiceDate,
    validUntil: form.showPaymentTerms ? form.dueDate : undefined,
    status: options?.status ?? "draft",
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
    theme: storedSettings?.themeId ?? form.settings.theme,
  };
}

export function mapUpdateQuotationFormToRequest(
  form: CreateInvoiceFormState,
  partyId: string,
  bankAccount?: OrganisationBankAccount | null,
  storedSettings?: StoredSalesInvoiceSettings | null,
  options?: { status?: QuotationStatus },
): UpdateQuotationRequest {
  const { quotationPrefix: _prefix, quotationNumber: _number, ...payload } =
    mapCreateQuotationFormToRequest(form, partyId, bankAccount, storedSettings, options);
  return payload;
}
