import type { FinancePaymentSummary } from "@/lib/types/finance-payments-api";
import type { TranslationKey } from "@/lib/localization";

export function getPaymentActivityHref(entry: FinancePaymentSummary): string {
  switch (entry.sourceType) {
    case "finance_voucher":
      return `/dashboard/finance/payments/${encodeURIComponent(entry.paymentId)}`;
    case "invoice_payment":
      return `/dashboard/sales/invoices/${encodeURIComponent(entry.paymentId)}`;
    case "sales_return_refund":
      return `/dashboard/sales/sales-returns/${encodeURIComponent(entry.paymentId)}`;
    case "credit_note_refund":
      return `/dashboard/sales/credit-notes/${encodeURIComponent(entry.paymentId)}`;
    case "purchase_payment":
      return `/dashboard/purchases/${encodeURIComponent(entry.purchaseBillId ?? entry.paymentId)}`;
    case "expense":
      return `/dashboard/finance/expenses`;
    case "payment_reversal":
      return entry.invoiceId
        ? `/dashboard/sales/invoices/${encodeURIComponent(entry.invoiceId)}`
        : entry.purchaseBillId
          ? `/dashboard/purchases/${encodeURIComponent(entry.purchaseBillId)}`
          : `/dashboard/purchases`;
    default:
      return `/dashboard/finance/payments/${encodeURIComponent(entry.paymentId)}`;
  }
}

export function getPaymentSourceLabelKey(
  sourceType: FinancePaymentSummary["sourceType"],
): TranslationKey {
  const map: Record<FinancePaymentSummary["sourceType"], TranslationKey> = {
    finance_voucher: "dashboard.financePayments.sourceVoucher",
    invoice_payment: "dashboard.financePayments.sourceInvoice",
    sales_return_refund: "dashboard.financePayments.sourceSalesReturn",
    credit_note_refund: "dashboard.financePayments.sourceCreditNote",
    purchase_payment: "dashboard.financePayments.sourcePurchase",
    expense: "dashboard.financePayments.sourceExpense",
    payment_reversal: "dashboard.paymentActivity.sourcePaymentReversal",
  };
  return map[sourceType];
}

export function getAdjustmentLabelKey(adjustmentLabel: string | undefined): TranslationKey | null {
  if (!adjustmentLabel) return null;
  const map: Record<string, TranslationKey> = {
    return_credited: "dashboard.financePayments.adjustmentReturnCredited",
    sales_return_refund: "dashboard.financePayments.adjustmentSalesReturn",
    credit_note_refund: "dashboard.financePayments.adjustmentCreditNote",
    invoice_payment_reversal: "dashboard.paymentActivity.adjustmentInvoiceReversal",
    purchase_payment_reversal: "dashboard.paymentActivity.adjustmentPurchaseReversal",
  };
  return map[adjustmentLabel] ?? null;
}
