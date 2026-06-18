"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params: Record<string, string>) {
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, value),
    template,
  );
}

type PayrollMarkPaidModalProps = {
  open: boolean;
  staffName: string;
  netPayLabel: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (paymentDate: string, paymentRemark: string) => void;
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PayrollMarkPaidModal({
  open,
  staffName,
  netPayLabel,
  submitting,
  error,
  onClose,
  onConfirm,
}: PayrollMarkPaidModalProps) {
  const { t } = useTranslation();
  const [paymentDate, setPaymentDate] = useState(todayIsoDate);
  const [paymentRemark, setPaymentRemark] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentDate(todayIsoDate());
      setPaymentRemark("");
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200/90 bg-white p-5 shadow-xl"
      >
        <h3 className="text-lg font-bold text-brand-primary">
          {t("dashboard.staff.payroll.markPaidTitle")}
        </h3>
        <p className="mt-1 text-sm text-brand-primary-muted">
          {formatMessage(t("dashboard.staff.payroll.markPaidHint"), { name: staffName, amount: netPayLabel })}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.staff.payroll.paymentDate")}
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.staff.payroll.paymentRemark")}
            </label>
            <textarea
              value={paymentRemark}
              onChange={(e) => setPaymentRemark(e.target.value)}
              rows={3}
              placeholder={t("dashboard.staff.payroll.paymentRemarkPlaceholder")}
              className="w-full rounded-md border border-slate-200/90 bg-white px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-md border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={submitting || !paymentDate}
            onClick={() => onConfirm(paymentDate, paymentRemark.trim())}
            className="h-10 rounded-md bg-brand-primary px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("common.pleaseWait") : t("dashboard.staff.payroll.markPaidConfirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
