"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { PurchaseBillPdfPreviewModal } from "@/components/dashboard/purchase/purchase-bill-pdf-preview-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDate, formatInr, inputClass, StatCard } from "@/lib/dashboard/page-utils";
import {
  buildPurchaseBillPdfUrl,
  fetchPurchaseBillDetail,
  recordPurchaseBillPayment,
} from "@/lib/purchase/purchases-api-client";
import type { PurchaseBillDetail, PurchasePaymentMode } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

export function PurchaseBillViewPage() {
  const { t } = useTranslation();
  const params = useParams<{ purchaseBillId: string }>();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const billId = params.purchaseBillId;

  const [bill, setBill] = useState<PurchaseBillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMode, setPayMode] = useState<PurchasePaymentMode>("cash");
  const [paying, setPaying] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const load = useCallback(async () => {
    if (!orgId || !billId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPurchaseBillDetail(orgId, billId);
      setBill(data);
      setPayAmount(String(data.balanceAmount));
    } catch (err) {
      setBill(null);
      setError(err instanceof Error ? err.message : t("dashboard.purchases.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, billId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePayment = async () => {
    if (!orgId || !billId || !payAmount) return;
    setPaying(true);
    try {
      const updated = await recordPurchaseBillPayment(orgId, billId, {
        amount: Number(payAmount),
        paymentDate: payDate,
        paymentMode: payMode,
      });
      setBill(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.view.paymentError"));
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!orgId || !billId) return;
    setDownloadingPdf(true);
    setError(null);
    try {
      const url = buildPurchaseBillPdfUrl(orgId, billId, Date.now());
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            t("dashboard.purchases.view.downloadPdfError"),
        );
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${bill?.displayNumber ?? "purchase-bill"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.view.downloadPdfError"));
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-brand-primary-muted">{t("common.pleaseWait")}</div>;
  }

  if (!bill) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? t("dashboard.purchases.view.loadError")}</p>
        <Link href="/dashboard/purchases" className="mt-4 inline-block text-sm font-semibold text-brand-orange-2 hover:underline">
          ← {t("dashboard.purchases.backToList")}
        </Link>
      </div>
    );
  }

  const attachedUrl = bill.billPdfUrl?.trim() || "";

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/purchases" className="text-sm font-semibold text-brand-orange-2 hover:underline">
        ← {t("dashboard.purchases.backToList")}
      </Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-primary lg:text-2xl">{bill.displayNumber}</h2>
          <p className="text-sm text-brand-primary-muted">
            {bill.partyName} · {formatDate(bill.billDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!orgId || !billId) return;
              setPreviewUrl(buildPurchaseBillPdfUrl(orgId, billId, Date.now()));
              setPreviewOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.purchases.view.previewPdf")}
          </button>
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={() => void handleDownloadPdf()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {downloadingPdf
              ? t("dashboard.purchases.view.downloadingPdf")
              : t("dashboard.purchases.view.downloadPdf")}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {attachedUrl ? (
        <div className="mt-4 rounded-sm border border-slate-200/90 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-brand-primary-muted">
            {t("dashboard.purchases.view.attachedBill")}
          </p>
          <a
            href={attachedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-sm font-semibold text-brand-orange-2 hover:underline"
          >
            {t("dashboard.purchases.view.openAttachedBill")}
          </a>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.purchases.view.total")} value={formatInr(bill.totalAmount)} accent="navy" />
        <StatCard label={t("dashboard.purchases.view.paid")} value={formatInr(bill.paidAmount)} accent="green" />
        <StatCard label={t("dashboard.purchases.view.balance")} value={formatInr(bill.balanceAmount)} accent="amber" />
        <StatCard label={t("dashboard.purchases.view.items")} value={String(bill.lineItems.length)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-slate-200/90 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-brand-surface/50 text-[11px] uppercase text-brand-primary-muted">
              <th className="px-4 py-3 text-left">{t("dashboard.purchases.create.colItem")}</th>
              <th className="px-4 py-3 text-right">{t("dashboard.purchases.create.colQty")}</th>
              <th className="px-4 py-3 text-right">{t("dashboard.purchases.create.colRate")}</th>
              <th className="px-4 py-3 text-right">{t("dashboard.purchases.create.colAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((line) => (
              <tr key={line.lineId} className="border-b border-slate-50">
                <td className="px-4 py-3">{line.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{line.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatInr(line.pricePerItem)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatInr(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bill.balanceAmount > 0 && (
        <div className="mt-6 max-w-md rounded-sm border border-slate-200/90 bg-white p-4">
          <p className="text-sm font-semibold text-brand-primary">{t("dashboard.purchases.view.recordPayment")}</p>
          <div className="mt-3 space-y-3">
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputClass} />
            <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className={inputClass} />
            <ModernSelect
              value={payMode}
              onChange={(v) => setPayMode(v as PurchasePaymentMode)}
              options={[
                { value: "cash", label: t("dashboard.purchases.create.modeCash") },
                { value: "upi", label: t("dashboard.purchases.create.modeUpi") },
                { value: "bank", label: t("dashboard.purchases.create.modeBank") },
              ]}
            />
            <button
              type="button"
              disabled={paying}
              onClick={() => void handlePayment()}
              className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {paying ? t("dashboard.purchases.view.paying") : t("dashboard.purchases.view.savePayment")}
            </button>
          </div>
        </div>
      )}

      <PurchaseBillPdfPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        pdfUrl={previewUrl}
        title={bill.displayNumber}
        filename={bill.displayNumber}
      />
    </div>
  );
}
