"use client";

import { saveErrorMessage } from "@/lib/api/conflict";
import { useState } from "react";
import { PosModalShell } from "@/components/dashboard/pos/pos-modal-shell";
import { cancelSalesInvoice } from "@/lib/sales/sales-api-client";
import type { InvoiceCancelBlocker, SalesInvoiceDetail } from "@/lib/types/sales-api";
import { useTranslation, type TranslationKey } from "@/lib/localization";

export const INVOICE_CANCEL_BLOCKER_KEYS: Record<InvoiceCancelBlocker, TranslationKey> = {
  already_cancelled: "dashboard.invoiceCancel.blockerAlreadyCancelled",
  irn_active: "dashboard.invoiceCancel.blockerIrnActive",
  ewb_active: "dashboard.invoiceCancel.blockerEwbActive",
  has_payments: "dashboard.invoiceCancel.blockerHasPayments",
  has_returns: "dashboard.invoiceCancel.blockerHasReturns",
  has_credit_notes: "dashboard.invoiceCancel.blockerHasCreditNotes",
};

export function formatInvoiceCancelBlockedTitle(
  t: (key: TranslationKey) => string,
  invoice: Pick<SalesInvoiceDetail, "cancellable" | "cancelBlockers">,
): string | undefined {
  const blockers = invoice.cancelBlockers ?? [];
  if (invoice.cancellable !== false && blockers.length === 0) return undefined;
  const reasons = blockers.map((blocker) => t(INVOICE_CANCEL_BLOCKER_KEYS[blocker]));
  const title = t("dashboard.invoiceCancel.blockedTitle").replace(/:\s*$/, "");
  return reasons.length > 0 ? `${title}: ${reasons.join(" ")}` : title;
}

/** Cancels the invoice itself (stock/ledger reversed by backend). 422 while an IRN is active. */
export function CancelInvoiceDialog({
  open,
  onClose,
  organisationId,
  invoice,
  onCancelled,
  onMarkUnpaid,
}: {
  open: boolean;
  onClose: () => void;
  organisationId: string;
  invoice: SalesInvoiceDetail;
  onCancelled: (invoice: SalesInvoiceDetail) => void;
  /** Offered when the only way forward is reversing payments first. */
  onMarkUnpaid?: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blockers = invoice.cancelBlockers ?? [];
  const blocked = invoice.cancellable === false || blockers.length > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await cancelSalesInvoice(organisationId, invoice.invoiceId, reason);
      onCancelled(updated);
      setReason("");
      onClose();
    } catch (err) {
      setError(saveErrorMessage(err, t, t("dashboard.invoiceCancel.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PosModalShell
      open={open}
      onClose={onClose}
      title={t("dashboard.invoiceCancel.title").replace("{number}", invoice.displayNumber)}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-sm border border-slate-200 px-4 text-sm font-semibold text-brand-primary"
          >
            {t("dashboard.invoiceCancel.keep")}
          </button>
          <button
            type="button"
            disabled={busy || blocked}
            onClick={() => void submit()}
            className="h-9 rounded-sm bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? t("dashboard.invoiceCancel.cancelling") : t("dashboard.invoiceCancel.confirm")}
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        {blocked ? (
          <div className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <p className="text-xs font-semibold">{t("dashboard.invoiceCancel.blockedTitle")}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
              {blockers.map((blocker) => (
                <li key={blocker}>
                  {t(INVOICE_CANCEL_BLOCKER_KEYS[blocker])}
                  {blocker === "has_payments" && onMarkUnpaid ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onMarkUnpaid();
                      }}
                      className="ml-2 font-semibold text-brand-primary underline"
                    >
                      {t("dashboard.invoiceCancel.markUnpaidCta")}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-xs text-brand-primary-muted">{t("dashboard.invoiceCancel.hint")}</p>
        <label className={blocked ? "hidden" : "block"}>
          <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
            {t("dashboard.invoiceCancel.reason")}
          </span>
          <textarea
            value={reason}
            maxLength={300}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-sm border border-slate-200 bg-white px-2 py-1.5 text-sm text-brand-primary outline-none focus:border-brand-primary"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </PosModalShell>
  );
}
