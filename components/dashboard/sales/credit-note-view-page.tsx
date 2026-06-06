"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { fetchCreditNoteDetail } from "@/lib/sales/credit-notes-api-client";
import type {
  CreditNoteDetail,
  CreditNoteSettlementMode,
  CreditNoteStatus,
  CreditNoteType,
} from "@/lib/types/credit-notes-api";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: CreditNoteStatus }) {
  const { t } = useTranslation();
  const styles: Record<CreditNoteStatus, string> = {
    draft: "bg-slate-100 text-slate-700 ring-slate-400/20",
    completed: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    cancelled: "bg-red-50 text-red-800 ring-red-600/15",
  };
  const labels: Record<CreditNoteStatus, string> = {
    draft: t("dashboard.creditNotes.statusDraft"),
    completed: t("dashboard.creditNotes.statusCompleted"),
    cancelled: t("dashboard.creditNotes.statusCancelled"),
  };

  return (
    <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TypeBadge({ noteType }: { noteType: CreditNoteType }) {
  const { t } = useTranslation();
  const isCredit = noteType === "credit";
  return (
    <span
      className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        isCredit
          ? "bg-blue-50 text-blue-800 ring-blue-600/15"
          : "bg-amber-50 text-amber-900 ring-amber-600/15"
      }`}
    >
      {isCredit ? t("dashboard.creditNotes.typeCredit") : t("dashboard.creditNotes.typeDebit")}
    </span>
  );
}

function settlementModeLabel(mode: CreditNoteSettlementMode, t: (key: TranslationKey) => string): string {
  const map: Record<CreditNoteSettlementMode, TranslationKey> = {
    cash: "dashboard.creditNotes.settlementCash",
    upi: "dashboard.creditNotes.settlementUpi",
    card: "dashboard.creditNotes.settlementCard",
    bank: "dashboard.creditNotes.settlementBank",
    credit_to_party: "dashboard.creditNotes.settlementCreditToParty",
  };
  return t(map[mode]);
}

export function CreditNoteViewPage({ creditNoteId }: { creditNoteId: string }) {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [creditNote, setCreditNote] = useState<CreditNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !creditNoteId.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const detail = await fetchCreditNoteDetail(orgId, creditNoteId.trim());
      setCreditNote(detail);
    } catch (err) {
      setCreditNote(null);
      setError(err instanceof Error ? err.message : t("dashboard.creditNotes.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, creditNoteId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="p-4 lg:p-6">
        <Link
          href="/dashboard/sales/credit-notes"
          className="text-sm font-medium text-brand-primary-muted transition-colors hover:text-brand-primary"
        >
          ← {t("dashboard.creditNotes.backToList")}
        </Link>
        <p className="mt-4 text-sm text-red-600">{error ?? t("dashboard.creditNotes.view.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/sales/credit-notes"
          className="text-sm font-medium text-brand-primary-muted transition-colors hover:text-brand-primary"
        >
          ← {t("dashboard.creditNotes.backToList")}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
              {t("dashboard.creditNotes.view.title").replace("{number}", creditNote.displayNumber)}
            </h2>
            <p className="mt-1 text-sm text-brand-primary-mid">
              {formatDate(creditNote.noteDate)} · {creditNote.partyName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TypeBadge noteType={creditNote.noteType} />
            <StatusBadge status={creditNote.status} />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label={t("dashboard.creditNotes.view.invoice")} value={creditNote.invoiceDisplayNumber} mono />
        <InfoCard
          label={t("dashboard.creditNotes.view.settlementMode")}
          value={settlementModeLabel(creditNote.settlementMode, t)}
        />
        <InfoCard label={t("dashboard.creditNotes.view.totalAmount")} value={formatInr(creditNote.totalAmount)} />
        <InfoCard
          label={t("dashboard.creditNotes.view.settlementAmount")}
          value={formatInr(creditNote.settlementAmount)}
        />
      </div>

      {(creditNote.reason || creditNote.notes) && (
        <div className="mb-6 rounded-md border border-slate-200/90 bg-white p-4">
          {creditNote.reason ? (
            <p className="text-sm text-brand-primary">
              <span className="font-semibold">{t("dashboard.creditNotes.view.reason")}: </span>
              {creditNote.reason}
            </p>
          ) : null}
          {creditNote.notes ? (
            <p className={`text-sm text-brand-primary-mid ${creditNote.reason ? "mt-2" : ""}`}>
              <span className="font-semibold text-brand-primary">{t("dashboard.creditNotes.view.notes")}: </span>
              {creditNote.notes}
            </p>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.creditNotes.view.colItem")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.creditNotes.view.colQty")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.creditNotes.view.colRate")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.creditNotes.view.colTax")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.creditNotes.view.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {creditNote.lineItems.map((line) => (
                <tr key={line.lineId} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-primary">{line.name}</p>
                    {line.serialNumbers && line.serialNumbers.length > 0 ? (
                      <p className="mt-1 font-mono text-[11px] text-brand-primary-muted">
                        {line.serialNumbers.join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-brand-primary-mid">
                    {line.qty} {line.unit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-brand-primary-mid">
                    {formatInr(line.pricePerItem)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-brand-primary-mid">{formatInr(line.tax)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-primary">
                    {formatInr(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/50">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-brand-primary">
                  {t("dashboard.creditNotes.view.subtotal")}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-brand-primary">
                  {formatInr(creditNote.subtotal)}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-brand-primary">
                  {t("dashboard.creditNotes.view.tax")}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-brand-primary">
                  {formatInr(creditNote.lineTax)}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-brand-primary">
                  {t("dashboard.creditNotes.view.grandTotal")}
                </td>
                <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-brand-primary">
                  {formatInr(creditNote.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/sales/invoices/${encodeURIComponent(creditNote.invoiceId)}`}
          className="inline-flex h-9 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-medium text-brand-primary transition-colors hover:bg-slate-50"
        >
          {t("dashboard.creditNotes.view.viewInvoice")}
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-slate-200/90 bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-brand-primary ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
