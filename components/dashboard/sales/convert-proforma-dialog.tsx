"use client";

import { useState } from "react";
import { PosModalShell } from "@/components/dashboard/pos/pos-modal-shell";
import { PAYMENT_MODES } from "@/lib/sales/create-invoice-form";
import { convertProforma, type ConvertProformaRequest } from "@/lib/sales/proformas-api-client";
import type { QuotationDetail } from "@/lib/types/quotations-api";
import type { SalesInvoiceDetail, SalesInvoiceType } from "@/lib/types/sales-api";
import { useTranslation } from "@/lib/localization";

const fieldClass =
  "h-9 w-full rounded-sm border border-slate-200 bg-white px-2 text-sm text-brand-primary outline-none focus:border-brand-primary";

export function ConvertProformaDialog({
  open,
  onClose,
  organisationId,
  proforma,
  onConverted,
}: {
  open: boolean;
  onClose: () => void;
  organisationId: string;
  proforma: QuotationDetail;
  onConverted: (result: { proforma: QuotationDetail; invoice: SalesInvoiceDetail | null }) => void;
}) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [invoiceType, setInvoiceType] = useState<SalesInvoiceType>("gst_invoice");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [paymentTermsDays, setPaymentTermsDays] = useState("");
  const [partyGstin, setPartyGstin] = useState("");
  const [fullyPaid, setFullyPaid] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const payload: ConvertProformaRequest = {
      invoiceType,
      invoiceDate,
      ...(paymentTermsDays.trim() ? { paymentTermsDays: Math.max(0, Number(paymentTermsDays) || 0) } : {}),
      ...(invoiceType === "gst_invoice" && partyGstin.trim()
        ? { partyGstin: partyGstin.trim().toUpperCase() }
        : {}),
      fullyPaid,
      ...(!fullyPaid && amountReceived.trim() ? { amountReceived: Math.max(0, Number(amountReceived) || 0) } : {}),
      ...((fullyPaid || Number(amountReceived) > 0) ? { paymentMode } : {}),
    };
    try {
      const result = await convertProforma(organisationId, proforma.quotationId, payload);
      onConverted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.proformas.convertError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PosModalShell
      open={open}
      onClose={onClose}
      title={t("dashboard.proformas.convertTitle").replace("{number}", proforma.displayNumber)}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-sm border border-slate-200 px-4 text-sm font-semibold text-brand-primary"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="h-9 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? t("dashboard.proformas.converting") : t("dashboard.proformas.convertCta")}
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-xs text-brand-primary-muted">{t("dashboard.proformas.convertHint")}</p>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
            {t("dashboard.proformas.invoiceType")}
          </span>
          <select
            className={fieldClass}
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value as SalesInvoiceType)}
          >
            <option value="gst_invoice">{t("dashboard.salesInvoices.create.invoiceTypeGstInvoice")}</option>
            <option value="cash_memo">{t("dashboard.salesInvoices.create.invoiceTypeCashMemo")}</option>
            <option value="bill_of_supply">{t("dashboard.billOfSupply.label")}</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
              {t("dashboard.proformas.invoiceDate")}
            </span>
            <input type="date" className={fieldClass} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
              {t("dashboard.proformas.paymentTermsDays")}
            </span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
            />
          </label>
        </div>
        {invoiceType === "gst_invoice" ? (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
              {t("dashboard.proformas.partyGstin")}
            </span>
            <input
              className={`${fieldClass} uppercase`}
              maxLength={15}
              value={partyGstin}
              onChange={(e) => setPartyGstin(e.target.value)}
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={fullyPaid} onChange={(e) => setFullyPaid(e.target.checked)} />
          {t("dashboard.proformas.fullyPaid")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {!fullyPaid ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
                {t("dashboard.proformas.amountReceived")}
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-primary-muted">
              {t("dashboard.proformas.paymentMode")}
            </span>
            <select className={fieldClass} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </PosModalShell>
  );
}
