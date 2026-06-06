import {
  buildLiveInvoicePreviewFromDetail,
  buildLiveInvoicePreviewModel,
} from "@/lib/sales/build-live-invoice-preview";
import type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";
import { mapLivePreviewToDocument } from "@/lib/sales/invoice-preview-document";
import type { InvoicePreviewDocument } from "@/lib/sales/invoice-preview-document-types";
import type { InvoiceOrganisationSnapshot } from "@/lib/sales/invoice-preview-formatters";
import type { StoredSalesInvoiceSettings } from "@/lib/sales/invoice-settings-config";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
import type { QuotationDetail } from "@/lib/types/quotations-api";
import type { SalesInvoiceDetail } from "@/lib/types/sales-api";
import type { SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";
import type { CreateInvoiceFormState } from "@/lib/sales/create-invoice-form";

const QUOTATION_DOC_META = {
  documentTitle: "QUOTATION",
  dueDateLabel: "Valid Until",
  hidePaymentSummary: true,
} as const;

type BuildPreviewInput = {
  form: CreateInvoiceFormState;
  party: SelectedInvoiceParty | null;
  businessName: string;
  organisation: InvoiceOrganisationSnapshot;
  bankAccount?: OrganisationBankAccount | null;
  storedSettings: StoredSalesInvoiceSettings;
};

function stripPaymentFromModel(model: LiveInvoicePreviewModel): LiveInvoicePreviewModel {
  return {
    ...model,
    summaryRows: model.summaryRows.filter((row) => row.label !== "Received Amount"),
    amountReceived: "₹ 0",
    balanceAmount: "₹ 0",
    paymentMode: "",
    partyBalance: undefined,
  };
}

export function buildLiveQuotationPreviewFromForm(input: BuildPreviewInput): LiveInvoicePreviewModel {
  return stripPaymentFromModel(buildLiveInvoicePreviewModel(input));
}

function quotationAsInvoiceDetail(quotation: QuotationDetail): SalesInvoiceDetail {
  return {
    invoiceId: quotation.quotationId,
    displayNumber: quotation.displayNumber,
    partyName: quotation.partyName,
    partyId: quotation.partyId,
    invoiceDate: quotation.quotationDate,
    dueDate: quotation.validUntil,
    totalAmount: quotation.totalAmount,
    amountReceived: 0,
    balanceAmount: 0,
    status: "unpaid",
    isCashSale: false,
    organisationId: quotation.organisationId,
    invoicePrefix: quotation.quotationPrefix,
    invoiceNumber: quotation.quotationNumber,
    paymentTermsDays: 0,
    lineItems: quotation.lineItems,
    notes: quotation.notes,
    terms: quotation.terms,
    bankAccount: quotation.bankAccount,
    additionalCharges: quotation.additionalCharges,
    discountAfterTax: quotation.discountAfterTax,
    discountType: quotation.discountType,
    discountTiming: quotation.discountTiming,
    autoRoundOff: quotation.autoRoundOff,
    roundOffAmount: quotation.roundOffAmount,
    subtotal: quotation.subtotal,
    lineTax: quotation.lineTax,
    additionalChargesTotal: quotation.additionalChargesTotal,
    additionalChargesTax: quotation.additionalChargesTax,
    taxableAmount: quotation.taxableAmount,
    discountAmount: quotation.discountAmount,
    totalBeforeRound: quotation.totalBeforeRound,
    paymentMode: "cash",
    theme: quotation.theme,
    partyPhone: quotation.partyPhone,
    createdByUserId: quotation.createdByUserId,
    updatedByUserId: quotation.updatedByUserId,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
  };
}

export function buildLiveQuotationPreviewFromDetail(
  quotation: QuotationDetail,
  businessName: string,
  organisation: InvoiceOrganisationSnapshot,
  party?: SelectedInvoiceParty | null,
): LiveInvoicePreviewModel {
  return stripPaymentFromModel(
    buildLiveInvoicePreviewFromDetail(
      quotationAsInvoiceDetail(quotation),
      businessName,
      organisation,
      party,
    ),
  );
}

export function mapQuotationPreviewToDocument(model: LiveInvoicePreviewModel): InvoicePreviewDocument {
  return {
    ...mapLivePreviewToDocument(model),
    ...QUOTATION_DOC_META,
  };
}
