"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchSalesInvoiceDetail, fetchSalesInvoices } from "@/lib/sales/sales-api-client";
import { defaultSalesReturnRefundMode } from "@/lib/sales/default-return-refund-mode";
import {
  buildReturnLineDrafts,
  calcReturnLineAmount,
  calcReturnTotal,
  getMaxReturnableQty,
  getReturnedQtyByInvoiceLine,
  getReturnedSerialsByInvoiceLine,
  getReturnableSerials,
  mapCreateSalesReturnFormToRequest,
  normalizeSerial,
  serialsMatch,
  type CreateSalesReturnFormState,
  type ReturnLineDraft,
} from "@/lib/sales/map-create-sales-return-request";
import {
  createSalesReturn,
  fetchNextSalesReturnNumber,
  fetchSalesReturnDetail,
  fetchSalesReturns,
} from "@/lib/sales/sales-returns-api-client";
import type { SalesInvoiceDetail, SalesInvoiceSummary } from "@/lib/types/sales-api";
import type { SalesRefundMode } from "@/lib/types/sales-returns-api";
import { useTranslation } from "@/lib/localization";

const inputSmClass =
  "h-9 w-full rounded-sm border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const textareaClass =
  "w-full rounded-sm border border-slate-200/90 bg-white px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

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

export function CreateSalesReturnPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceOptions, setInvoiceOptions] = useState<SalesInvoiceSummary[]>([]);
  const [invoiceSearchLoading, setInvoiceSearchLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [returnedByLine, setReturnedByLine] = useState<Map<string, number>>(new Map());
  const [returnedSerialsByLine, setReturnedSerialsByLine] = useState<Map<string, Set<string>>>(new Map());
  const [form, setForm] = useState<CreateSalesReturnFormState | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = activeOrganisationId?.trim() ?? "";

  const searchInvoices = useCallback(async () => {
    if (!orgId) return;
    setInvoiceSearchLoading(true);
    try {
      const data = await fetchSalesInvoices(orgId, {
        search: invoiceSearch.trim() || undefined,
        limit: 20,
        page: 1,
      });
      setInvoiceOptions(
        data.items.filter((row) => row.status !== "cancelled" && row.status !== "returned"),
      );
    } catch {
      setInvoiceOptions([]);
    } finally {
      setInvoiceSearchLoading(false);
    }
  }, [orgId, invoiceSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchInvoices();
    }, invoiceSearch ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [searchInvoices, invoiceSearch]);

  const loadInvoice = useCallback(
    async (invoiceId: string) => {
      if (!orgId || !invoiceId.trim()) return;
      setLoadingInvoice(true);
      setError(null);
      try {
        const [detail, priorReturns, nextNumber] = await Promise.all([
          fetchSalesInvoiceDetail(orgId, invoiceId.trim()),
          fetchSalesReturns(orgId, { invoiceId: invoiceId.trim(), limit: 100, page: 1 }),
          fetchNextSalesReturnNumber(orgId),
        ]);

        const priorDetails = await Promise.all(
          priorReturns.items
            .filter((row) => row.status === "completed")
            .map((row) => fetchSalesReturnDetail(orgId, row.salesReturnId).catch(() => null)),
        );

        const completedReturns = priorDetails.filter((row): row is NonNullable<typeof row> => row !== null);
        const returnedMap = getReturnedQtyByInvoiceLine(completedReturns);
        const returnedSerialsMap = getReturnedSerialsByInvoiceLine(completedReturns);

        setInvoice(detail);
        setReturnedByLine(returnedMap);
        setReturnedSerialsByLine(returnedSerialsMap);
        setSelectedInvoiceId(invoiceId.trim());
        setForm({
          invoiceId: invoiceId.trim(),
          returnPrefix: nextNumber.returnPrefix,
          returnNumber: nextNumber.returnNumber,
          returnDate: new Date().toISOString().slice(0, 10),
          reason: "",
          notes: "",
          refundMode: defaultSalesReturnRefundMode(detail),
          lines: buildReturnLineDrafts(detail),
        });
      } catch (err) {
        setInvoice(null);
        setForm(null);
        setError(err instanceof Error ? err.message : t("dashboard.salesReturns.create.loadInvoiceError"));
      } finally {
        setLoadingInvoice(false);
      }
    },
    [orgId, t],
  );

  const returnTotal = useMemo(() => {
    if (!invoice || !form) return 0;
    return calcReturnTotal(invoice, form.lines);
  }, [invoice, form]);

  const hasReturnLines = useMemo(() => {
    return form?.lines.some((line) => line.returnQty > 0) ?? false;
  }, [form]);

  const updateLineQty = useCallback(
    (invoiceLineId: string, qty: number) => {
      if (!invoice) return;
      const invoiceLine = invoice.lineItems.find((row) => row.lineId === invoiceLineId);
      if (!invoiceLine) return;
      const maxQty = getMaxReturnableQty(invoiceLine, returnedByLine.get(invoiceLineId) ?? 0);
      const nextQty = Math.min(Math.max(0, qty), maxQty);

      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lines: prev.lines.map((line) =>
            line.invoiceLineId === invoiceLineId
              ? {
                  ...line,
                  returnQty: nextQty,
                  selectedSerials:
                    invoiceLine.serialNumbers && invoiceLine.serialNumbers.length > 0
                      ? (line.selectedSerials ?? []).slice(0, nextQty)
                      : [],
                }
              : line,
          ),
        };
      });
    },
    [invoice, returnedByLine],
  );

  const setSerialLineSelection = useCallback(
    (invoiceLineId: string, serials: string[]) => {
      if (!invoice) return;
      const invoiceLine = invoice.lineItems.find((row) => row.lineId === invoiceLineId);
      if (!invoiceLine) return;
      const maxQty = getMaxReturnableQty(invoiceLine, returnedByLine.get(invoiceLineId) ?? 0);
      const normalized = serials.map(normalizeSerial).filter(Boolean).slice(0, maxQty);

      setForm((prev) => {
        if (!prev) return prev;
        const hasLine = prev.lines.some((line) => line.invoiceLineId === invoiceLineId);
        const nextLine: ReturnLineDraft = {
          invoiceLineId,
          selectedSerials: normalized,
          returnQty: normalized.length,
        };
        return {
          ...prev,
          lines: hasLine
            ? prev.lines.map((line) => (line.invoiceLineId === invoiceLineId ? nextLine : line))
            : [...prev.lines, nextLine],
        };
      });
    },
    [invoice, returnedByLine],
  );

  const toggleSerial = useCallback(
    (invoiceLineId: string, serial: string) => {
      if (!invoice) return;
      const invoiceLine = invoice.lineItems.find((row) => row.lineId === invoiceLineId);
      if (!invoiceLine) return;
      const normalized = normalizeSerial(serial);
      if (!normalized) return;
      const maxQty = getMaxReturnableQty(invoiceLine, returnedByLine.get(invoiceLineId) ?? 0);

      setForm((prev) => {
        if (!prev) return prev;
        const current =
          prev.lines.find((line) => line.invoiceLineId === invoiceLineId) ??
          ({ invoiceLineId, returnQty: 0, selectedSerials: [] } satisfies ReturnLineDraft);
        const selected = [...(current.selectedSerials ?? [])];
        const existingIdx = selected.findIndex((row) => serialsMatch(row, normalized));
        if (existingIdx >= 0) {
          selected.splice(existingIdx, 1);
        } else if (selected.length < maxQty) {
          selected.push(normalized);
        }
        const nextLine: ReturnLineDraft = {
          invoiceLineId,
          selectedSerials: selected,
          returnQty: selected.length,
        };
        const hasLine = prev.lines.some((line) => line.invoiceLineId === invoiceLineId);
        return {
          ...prev,
          lines: hasLine
            ? prev.lines.map((line) => (line.invoiceLineId === invoiceLineId ? nextLine : line))
            : [...prev.lines, nextLine],
        };
      });
    },
    [invoice, returnedByLine],
  );

  const handleSave = async () => {
    if (!orgId || !invoice || !form) return;
    if (!hasReturnLines) {
      setError(t("dashboard.salesReturns.create.validationItems"));
      return;
    }

    for (const draft of form.lines) {
      if (draft.returnQty <= 0) continue;
      const invoiceLine = invoice.lineItems.find((row) => row.lineId === draft.invoiceLineId);
      if (!invoiceLine) continue;
      if (invoiceLine.serialNumbers && invoiceLine.serialNumbers.length > 0) {
        const selected = (draft.selectedSerials ?? []).map(normalizeSerial).filter(Boolean);
        if (selected.length !== draft.returnQty || selected.length === 0) {
          setError(t("dashboard.salesReturns.create.validationSerials"));
          return;
        }
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = mapCreateSalesReturnFormToRequest(invoice, form);
      const created = await createSalesReturn(orgId, payload);
      router.push(`/dashboard/sales/sales-returns/${encodeURIComponent(created.salesReturnId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.salesReturns.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!orgId) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-brand-primary-muted">{t("dashboard.salesReturns.create.noOrganisation")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/sales/sales-returns"
            className="text-sm font-medium text-brand-primary-muted transition-colors hover:text-brand-primary"
          >
            ← {t("dashboard.salesReturns.backToList")}
          </Link>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.salesReturns.createTitle")}
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-sm border border-slate-200/90 bg-white p-4">
          <h3 className="text-sm font-semibold text-brand-primary">{t("dashboard.salesReturns.create.selectInvoice")}</h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder={t("dashboard.salesReturns.create.searchInvoice")}
              className={inputSmClass}
            />
          </div>

          <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-slate-100">
            {invoiceSearchLoading ? (
              <p className="px-3 py-4 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
            ) : invoiceOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-brand-primary-muted">
                {t("dashboard.salesReturns.create.noInvoices")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invoiceOptions.map((row) => (
                  <li key={row.invoiceId}>
                    <button
                      type="button"
                      onClick={() => void loadInvoice(row.invoiceId)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50/50 ${
                        selectedInvoiceId === row.invoiceId ? "bg-blue-50/80" : ""
                      }`}
                    >
                      <span>
                        <span className="font-mono text-xs font-semibold text-brand-primary">{row.displayNumber}</span>
                        <span className="ml-2 text-brand-primary-mid">{row.partyName}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-brand-primary-mid">
                        {formatDate(row.invoiceDate)} · {formatInr(row.totalAmount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {loadingInvoice ? (
          <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
        ) : invoice && form ? (
          <>
            <section className="rounded-sm border border-slate-200/90 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
                    {t("dashboard.salesReturns.create.invoiceDetails")}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-brand-primary">{invoice.displayNumber}</p>
                  <p className="text-sm text-brand-primary-mid">
                    {invoice.partyName} · {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                      {t("dashboard.salesReturns.create.returnNumber")}
                    </span>
                    <div className="flex gap-1">
                      <input
                        value={form.returnPrefix}
                        onChange={(e) => setForm({ ...form, returnPrefix: e.target.value })}
                        className={`${inputSmClass} max-w-[120px]`}
                        readOnly
                      />
                      <input
                        value={form.returnNumber}
                        onChange={(e) => setForm({ ...form, returnNumber: e.target.value })}
                        className={inputSmClass}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                      {t("dashboard.salesReturns.create.returnDate")}
                    </span>
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                      className={inputSmClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                      {t("dashboard.salesReturns.create.refundMode")}
                    </span>
                    <ModernSelect
                      value={form.refundMode}
                      onChange={(value) => setForm({ ...form, refundMode: value as SalesRefundMode })}
                      options={[
                        { value: "credit_to_party", label: t("dashboard.salesReturns.refundCreditToParty") },
                        { value: "cash", label: t("dashboard.salesReturns.refundCash") },
                        { value: "upi", label: t("dashboard.salesReturns.refundUpi") },
                        { value: "card", label: t("dashboard.salesReturns.refundCard") },
                        { value: "bank", label: t("dashboard.salesReturns.refundBank") },
                      ]}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto scrollbar-brand">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                      <th className="px-2 py-2">{t("dashboard.salesReturns.create.colItem")}</th>
                      <th className="px-2 py-2 text-right">{t("dashboard.salesReturns.create.colSold")}</th>
                      <th className="px-2 py-2 text-right">{t("dashboard.salesReturns.create.colAlreadyReturned")}</th>
                      <th className="px-2 py-2 text-right">{t("dashboard.salesReturns.create.colReturnQty")}</th>
                      <th className="px-2 py-2 text-right">{t("dashboard.salesReturns.create.colAmount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((line) => {
                      const draft = form.lines.find((row) => row.invoiceLineId === line.lineId);
                      const alreadyReturned = returnedByLine.get(line.lineId) ?? 0;
                      const maxQty = getMaxReturnableQty(line, alreadyReturned);
                      const lineAmount = draft ? calcReturnLineAmount(line, draft.returnQty) : 0;

                      const returnableSerials = getReturnableSerials(
                        line,
                        returnedSerialsByLine.get(line.lineId),
                      );

                      return (
                        <ReturnLineRow
                          key={line.lineId}
                          line={line}
                          draft={draft}
                          alreadyReturned={alreadyReturned}
                          maxQty={maxQty}
                          returnableSerials={returnableSerials}
                          lineAmount={lineAmount}
                          onQtyChange={updateLineQty}
                          onToggleSerial={toggleSerial}
                          onSetSerialSelection={setSerialLineSelection}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.salesReturns.create.reason")}
                </span>
                <input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className={inputSmClass}
                  placeholder={t("dashboard.salesReturns.create.reasonPlaceholder")}
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.salesReturns.create.notes")}
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={textareaClass}
                />
              </label>
            </section>

            <div className="flex flex-col gap-3 rounded-md border border-slate-200/90 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
                  {t("dashboard.salesReturns.create.returnTotal")}
                </p>
                <p className="text-2xl font-bold tabular-nums text-brand-primary">{formatInr(returnTotal)}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !hasReturnLines}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t("dashboard.salesReturns.create.saving") : t("dashboard.salesReturns.create.saveReturn")}
              </button>
            </div>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function ReturnLineRow({
  line,
  draft,
  alreadyReturned,
  maxQty,
  returnableSerials,
  lineAmount,
  onQtyChange,
  onToggleSerial,
  onSetSerialSelection,
}: {
  line: SalesInvoiceDetail["lineItems"][number];
  draft: ReturnLineDraft | undefined;
  alreadyReturned: number;
  maxQty: number;
  returnableSerials: string[];
  lineAmount: number;
  onQtyChange: (invoiceLineId: string, qty: number) => void;
  onToggleSerial: (invoiceLineId: string, serial: string) => void;
  onSetSerialSelection: (invoiceLineId: string, serials: string[]) => void;
}) {
  const { t } = useTranslation();
  const returnQty = draft?.returnQty ?? 0;
  const isSerialised = returnableSerials.length > 0;

  return (
    <tr className="border-b border-slate-100 align-top last:border-b-0">
      <td className="px-2 py-3">
        <p className="font-medium text-brand-primary">{line.name}</p>
        {isSerialised && maxQty > 0 ? (
          <div className="mt-2">
            <p className="mb-1.5 text-[11px] text-brand-primary-muted">
              {t("dashboard.salesReturns.create.selectSerialsHint")}
            </p>
            <div className="flex flex-col gap-1.5">
              {returnableSerials.map((serial) => {
                const selected =
                  draft?.selectedSerials?.some((row) => serialsMatch(row, serial)) ?? false;
                const inputId = `return-serial-${line.lineId}-${serial}`;
                return (
                  <label
                    key={serial}
                    htmlFor={inputId}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                      selected
                        ? "border-brand-primary/30 bg-brand-primary/[0.06]"
                        : "border-slate-200/90 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSerial(line.lineId, serial)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                    />
                    <span className="font-mono text-[11px] text-brand-primary">{serial}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </td>
      <td className="px-2 py-3 text-right tabular-nums text-brand-primary-mid">
        {line.qty} {line.unit}
      </td>
      <td className="px-2 py-3 text-right tabular-nums text-brand-primary-mid">{alreadyReturned}</td>
      <td className="px-2 py-3 text-right">
        {maxQty <= 0 ? (
          <span className="text-xs text-brand-primary-muted">{t("dashboard.salesReturns.create.fullyReturned")}</span>
        ) : isSerialised ? (
          <div className="flex flex-col items-end gap-1.5">
            <span className="tabular-nums font-semibold text-brand-primary">{returnQty}</span>
            {returnQty > 0 ? (
              <button
                type="button"
                onClick={() => onSetSerialSelection(line.lineId, [])}
                className="text-[11px] font-medium text-red-600 hover:underline"
              >
                {t("dashboard.salesReturns.create.clearSerial")}
              </button>
            ) : returnableSerials.length === 1 ? (
              <button
                type="button"
                onClick={() => onSetSerialSelection(line.lineId, returnableSerials)}
                className="inline-flex h-8 items-center rounded-md bg-brand-primary px-3 text-[11px] font-semibold text-white hover:brightness-110"
              >
                {t("dashboard.salesReturns.create.returnItem")}
              </button>
            ) : (
              <span className="max-w-[120px] text-right text-[10px] text-brand-primary-muted">
                {t("dashboard.salesReturns.create.selectSerialsHint")}
              </span>
            )}
          </div>
        ) : (
          <input
            type="number"
            min={0}
            max={maxQty}
            step="any"
            value={returnQty || ""}
            onChange={(e) => onQtyChange(line.lineId, Number(e.target.value) || 0)}
            className={`${inputSmClass} max-w-[88px] text-right`}
          />
        )}
      </td>
      <td className="px-2 py-3 text-right tabular-nums font-medium text-brand-primary">
        {returnQty > 0 ? formatInr(lineAmount) : "—"}
      </td>
    </tr>
  );
}
