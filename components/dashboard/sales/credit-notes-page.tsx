"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchCreditNotes } from "@/lib/sales/credit-notes-api-client";
import type {
  CreditNoteStatus,
  CreditNoteSummary,
  CreditNoteType,
} from "@/lib/types/credit-notes-api";
import { useTranslation } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "navy" | "green" | "amber" }) {
  const ring =
    accent === "green"
      ? "border-emerald-200/80 bg-emerald-50/30"
      : accent === "amber"
        ? "border-amber-200/80 bg-amber-50/30"
        : accent === "navy"
          ? "border-brand-primary/15 bg-brand-primary/[0.03]"
          : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-3.5 py-3 ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
    </div>
  );
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
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TypeBadge({ noteType }: { noteType: CreditNoteType }) {
  const { t } = useTranslation();
  const isCredit = noteType === "credit";
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        isCredit
          ? "bg-blue-50 text-blue-800 ring-blue-600/15"
          : "bg-amber-50 text-amber-900 ring-amber-600/15"
      }`}
    >
      {isCredit ? t("dashboard.creditNotes.typeCredit") : t("dashboard.creditNotes.typeDebit")}
    </span>
  );
}

export function CreditNotesPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [noteType, setNoteType] = useState<string>("all");
  const [notes, setNotes] = useState<CreditNoteSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCreditNotes(orgId, {
        status: status as CreditNoteStatus | "all",
        noteType: noteType as CreditNoteType | "all",
        search: query.trim() || undefined,
        limit: 100,
        page: 1,
      });
      setNotes(data.items);
    } catch (err) {
      setNotes([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.creditNotes.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, status, noteType, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);
    let todayTotal = 0;
    let monthTotal = 0;
    let completedCount = 0;

    for (const row of notes) {
      if (row.noteDate === today) todayTotal += row.totalAmount;
      if (row.noteDate.startsWith(monthPrefix)) monthTotal += row.totalAmount;
      if (row.status === "completed") completedCount += 1;
    }

    return { todayTotal, monthTotal, totalCount: notes.length, completedCount };
  }, [notes]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.creditNotes.subtitle")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.creditNotes")}
          </h2>
        </div>
        <Link
          href="/dashboard/sales/credit-notes/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.creditNotes.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.creditNotes.todayTotal")} value={formatInr(summary.todayTotal)} accent="green" />
        <StatCard label={t("dashboard.creditNotes.monthTotal")} value={formatInr(summary.monthTotal)} accent="navy" />
        <StatCard label={t("dashboard.creditNotes.totalCount")} value={String(summary.totalCount)} />
        <StatCard
          label={t("dashboard.creditNotes.completedCount")}
          value={String(summary.completedCount)}
          accent="amber"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.creditNotes.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.creditNotes.searchPlaceholder")}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[140px] shrink-0 sm:w-[160px]">
            <ModernSelect
              value={noteType}
              onChange={setNoteType}
              options={[
                { value: "all", label: t("dashboard.creditNotes.allTypes") },
                { value: "credit", label: t("dashboard.creditNotes.typeCredit") },
                { value: "debit", label: t("dashboard.creditNotes.typeDebit") },
              ]}
              aria-label={t("dashboard.creditNotes.filterType")}
            />
          </div>
          <div className="w-full min-w-[140px] shrink-0 sm:w-[160px]">
            <ModernSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: t("dashboard.creditNotes.allStatuses") },
                { value: "completed", label: t("dashboard.creditNotes.statusCompleted") },
                { value: "draft", label: t("dashboard.creditNotes.statusDraft") },
                { value: "cancelled", label: t("dashboard.creditNotes.statusCancelled") },
              ]}
              aria-label={t("dashboard.creditNotes.filterStatus")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.creditNotes.colNote")}</th>
                <th className="px-4 py-3">{t("dashboard.creditNotes.colType")}</th>
                <th className="px-4 py-3">{t("dashboard.creditNotes.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.creditNotes.colInvoice")}</th>
                <th className="px-4 py-3">{t("dashboard.creditNotes.colParty")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.creditNotes.colAmount")}</th>
                <th className="px-4 py-3">{t("dashboard.creditNotes.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.creditNotes.empty")}
                  </td>
                </tr>
              ) : (
                notes.map((creditNote) => <CreditNoteRow key={creditNote.creditNoteId} creditNote={creditNote} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreditNoteRow({ creditNote }: { creditNote: CreditNoteSummary }) {
  const router = useRouter();
  const href = `/dashboard/sales/credit-notes/${encodeURIComponent(creditNote.creditNoteId)}`;

  const openNote = () => {
    router.push(href);
  };

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-blue-50/40 hover:[&_span]:underline"
      onClick={openNote}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openNote();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open note ${creditNote.displayNumber}`}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-brand-primary underline-offset-2">
          {creditNote.displayNumber}
        </span>
      </td>
      <td className="px-4 py-3">
        <TypeBadge noteType={creditNote.noteType} />
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{formatDate(creditNote.noteDate)}</td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-brand-primary-mid">{creditNote.invoiceDisplayNumber}</span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-primary">{creditNote.partyName}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="font-semibold tabular-nums text-brand-primary">{formatInr(creditNote.totalAmount)}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={creditNote.status} />
      </td>
    </tr>
  );
}
