"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import {
  createFinancePayment,
  fetchNextFinancePaymentNumber,
} from "@/lib/finance/finance-payments-api-client";
import { fetchParties, fetchPartyDetail } from "@/lib/parties/parties-api-client";
import { formatSignedPartyBalance } from "@/lib/parties/party-ledger-utils";
import type { PartyDetail, PartySummary } from "@/lib/types/parties-api";
import type { FinancePaymentMode, FinancePaymentType } from "@/lib/types/finance-payments-api";
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

type FormState = {
  paymentType: FinancePaymentType;
  partyId: string;
  paymentPrefix: string;
  paymentNumber: string;
  paymentDate: string;
  amount: string;
  paymentMode: FinancePaymentMode;
  referenceNumber: string;
  notes: string;
  allocateToInvoices: boolean;
};

export function CreatePaymentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrganisationId } = useUserMe();
  const initialPartyId = searchParams.get("partyId")?.trim() ?? "";
  const initialPaymentType =
    searchParams.get("type") === "payment_out" ? "payment_out" : "payment_in";

  const [partySearch, setPartySearch] = useState("");
  const [partyOptions, setPartyOptions] = useState<PartySummary[]>([]);
  const [partySearchLoading, setPartySearchLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PartyDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loadingParty, setLoadingParty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = activeOrganisationId?.trim() ?? "";

  const searchParties = useCallback(async () => {
    if (!orgId) return;
    setPartySearchLoading(true);
    try {
      const data = await fetchParties(orgId, {
        search: partySearch.trim() || undefined,
        limit: 20,
        page: 1,
      });
      setPartyOptions(data.items);
    } catch {
      setPartyOptions([]);
    } finally {
      setPartySearchLoading(false);
    }
  }, [orgId, partySearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchParties();
    }, partySearch ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [searchParties, partySearch]);

  const initForm = useCallback(
    async (paymentType: FinancePaymentType) => {
      if (!orgId) return;
      const nextNumber = await fetchNextFinancePaymentNumber(orgId, paymentType);
      setForm({
        paymentType,
        partyId: "",
        paymentPrefix: nextNumber.paymentPrefix,
        paymentNumber: nextNumber.paymentNumber,
        paymentDate: new Date().toISOString().slice(0, 10),
        amount: "",
        paymentMode: "cash",
        referenceNumber: "",
        notes: "",
        allocateToInvoices: true,
      });
    },
    [orgId],
  );

  useEffect(() => {
    if (orgId) void initForm(initialPaymentType);
  }, [orgId, initForm, initialPaymentType]);

  const changePaymentType = useCallback(
    async (paymentType: FinancePaymentType) => {
      if (!orgId || !form) return;
      try {
        const nextNumber = await fetchNextFinancePaymentNumber(orgId, paymentType);
        setForm({
          ...form,
          paymentType,
          paymentPrefix: nextNumber.paymentPrefix,
          paymentNumber: nextNumber.paymentNumber,
        });
      } catch {
        setForm({ ...form, paymentType });
      }
    },
    [orgId, form],
  );

  const selectParty = useCallback(
    async (partyId: string) => {
      if (!orgId || !form) return;
      setLoadingParty(true);
      setError(null);
      try {
        const party = await fetchPartyDetail(orgId, partyId);
        setSelectedParty(party);
        setForm({ ...form, partyId: party.partyId });
      } catch (err) {
        setSelectedParty(null);
        setError(err instanceof Error ? err.message : t("dashboard.financePayments.create.loadPartyError"));
      } finally {
        setLoadingParty(false);
      }
    },
    [orgId, form, t],
  );

  useEffect(() => {
    if (!orgId || !initialPartyId || !form) return;
    void selectParty(initialPartyId);
  }, [orgId, initialPartyId, form, selectParty]);

  const handleSave = async () => {
    if (!orgId || !form || !selectedParty) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("dashboard.financePayments.create.validationAmount"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createFinancePayment(orgId, {
        paymentType: form.paymentType,
        partyId: form.partyId,
        paymentPrefix: form.paymentPrefix.trim() || undefined,
        paymentNumber: form.paymentNumber.trim() || undefined,
        paymentDate: form.paymentDate,
        amount,
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber.trim() || undefined,
        notes: form.notes.trim() || undefined,
        ...(form.paymentType === "payment_in"
          ? { allocateToInvoices: form.allocateToInvoices }
          : {}),
      });
      router.push(`/dashboard/finance/payments/${encodeURIComponent(created.paymentId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.financePayments.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!orgId) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-brand-primary-muted">{t("dashboard.financePayments.create.noOrganisation")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/finance/payments"
          className="text-sm font-medium text-brand-primary-muted transition-colors hover:text-brand-primary"
        >
          ← {t("dashboard.financePayments.backToList")}
        </Link>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
          {t("dashboard.financePayments.createTitle")}
        </h2>
      </div>

      <div className="space-y-6">
        {form ? (
          <section className="rounded-sm border border-slate-200/90 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.financePayments.create.paymentType")}
                </span>
                <ModernSelect
                  value={form.paymentType}
                  onChange={(value) => void changePaymentType(value as FinancePaymentType)}
                  options={[
                    { value: "payment_in", label: t("dashboard.financePayments.typeIn") },
                    { value: "payment_out", label: t("dashboard.financePayments.typeOut") },
                  ]}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.financePayments.create.voucherNumber")}
                </span>
                <div className="flex gap-1">
                  <input value={form.paymentPrefix} readOnly className={`${inputSmClass} max-w-[120px]`} />
                  <input
                    value={form.paymentNumber}
                    onChange={(e) => setForm({ ...form, paymentNumber: e.target.value })}
                    className={inputSmClass}
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.financePayments.create.paymentDate")}
                </span>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  className={inputSmClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.financePayments.create.paymentMode")}
                </span>
                <ModernSelect
                  value={form.paymentMode}
                  onChange={(value) => setForm({ ...form, paymentMode: value as FinancePaymentMode })}
                  options={[
                    { value: "cash", label: t("dashboard.financePayments.modeCash") },
                    { value: "upi", label: t("dashboard.financePayments.modeUpi") },
                    { value: "card", label: t("dashboard.financePayments.modeCard") },
                    { value: "bank", label: t("dashboard.financePayments.modeBank") },
                    { value: "cheque", label: t("dashboard.financePayments.modeCheque") },
                  ]}
                />
              </label>
            </div>
          </section>
        ) : null}

        <section className="rounded-sm border border-slate-200/90 bg-white p-4">
          <h3 className="text-sm font-semibold text-brand-primary">
            {t("dashboard.financePayments.create.selectParty")}
          </h3>
          <input
            type="search"
            value={partySearch}
            onChange={(e) => setPartySearch(e.target.value)}
            placeholder={t("dashboard.financePayments.create.searchParty")}
            className={`${inputSmClass} mt-3`}
          />
          <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-slate-100">
            {partySearchLoading ? (
              <p className="px-3 py-4 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
            ) : partyOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-brand-primary-muted">
                {t("dashboard.financePayments.create.noParties")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {partyOptions.map((row) => (
                  <li key={row.partyId}>
                    <button
                      type="button"
                      onClick={() => void selectParty(row.partyId)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50/50 ${
                        selectedParty?.partyId === row.partyId ? "bg-blue-50/80" : ""
                      }`}
                    >
                      <span className="font-medium text-brand-primary">{row.name}</span>
                      <span className="shrink-0 text-xs text-brand-primary-mid">
                        {formatSignedPartyBalance(row.balance)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {loadingParty ? (
          <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
        ) : selectedParty && form ? (
          <>
            <section className="rounded-sm border border-slate-200/90 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
                {t("dashboard.financePayments.create.partyDetails")}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-primary">{selectedParty.name}</p>
              <p className="text-sm text-brand-primary-mid">
                {t("dashboard.financePayments.create.currentBalance")}:{" "}
                {formatSignedPartyBalance(selectedParty.currentBalance)}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.financePayments.create.amount")}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className={inputSmClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.financePayments.create.referenceNumber")}
                  </span>
                  <input
                    value={form.referenceNumber}
                    onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                    placeholder={t("dashboard.financePayments.create.referencePlaceholder")}
                    className={inputSmClass}
                  />
                </label>
              </div>

              {form.paymentType === "payment_in" ? (
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-brand-primary">
                  <input
                    type="checkbox"
                    checked={form.allocateToInvoices}
                    onChange={(e) => setForm({ ...form, allocateToInvoices: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                  />
                  {t("dashboard.financePayments.create.allocateToInvoices")}
                </label>
              ) : null}

              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.financePayments.create.notes")}
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
                  {form.paymentType === "payment_in"
                    ? t("dashboard.financePayments.create.receiving")
                    : t("dashboard.financePayments.create.paying")}
                </p>
                <p className="text-2xl font-bold tabular-nums text-brand-primary">
                  {form.amount ? formatInr(Number(form.amount)) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !form.amount}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t("dashboard.financePayments.create.saving") : t("dashboard.financePayments.create.savePayment")}
              </button>
            </div>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
