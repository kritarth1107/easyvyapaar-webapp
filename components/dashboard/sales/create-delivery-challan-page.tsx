"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddItemsToBillModal } from "@/components/dashboard/sales/add-items-to-bill-modal";
import { PartySelectModal, type SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import type { InventoryBillPick } from "@/lib/types/inventory-ui";
import {
  createDeliveryChallan,
  fetchNextDeliveryChallanNumber,
} from "@/lib/sales/delivery-challans-api-client";
import {
  buildChallanLinesFromInvoice,
  mapCreateDeliveryChallanFormToRequest,
  mergeInventoryPickIntoChallanLines,
  type CreateDeliveryChallanFormState,
  type DeliveryChallanLineDraft,
} from "@/lib/sales/map-create-delivery-challan-request";
import { fetchSalesInvoiceDetail, fetchSalesInvoices } from "@/lib/sales/sales-api-client";
import type { SalesInvoiceSummary } from "@/lib/types/sales-api";
import { useTranslation } from "@/lib/localization";

const inputSmClass =
  "h-9 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const textareaClass =
  "w-full rounded-md border border-slate-200/90 bg-white px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CreateDeliveryChallanPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();

  const orgId = activeOrganisationId?.trim() ?? "";
  const [party, setParty] = useState<SelectedInvoiceParty | null>(null);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateDeliveryChallanFormState | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceOptions, setInvoiceOptions] = useState<SalesInvoiceSummary[]>([]);
  const [invoiceSearchLoading, setInvoiceSearchLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    void fetchNextDeliveryChallanNumber(orgId)
      .then((next) => {
        setForm({
          challanPrefix: next.challanPrefix,
          challanNumber: next.challanNumber,
          challanDate: new Date().toISOString().slice(0, 10),
          deliveryDate: "",
          invoiceId: "",
          invoiceDisplayNumber: "",
          shippingAddress: "",
          vehicleNumber: "",
          transportRef: "",
          notes: "",
          lines: [],
        });
      })
      .catch(() => {
        setError(t("dashboard.deliveryChallans.create.loadNumberError"));
      });
  }, [orgId, t]);

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

  const totalQty = useMemo(
    () => (form?.lines ?? []).reduce((sum, line) => sum + line.qty, 0),
    [form?.lines],
  );

  const patchForm = (partial: Partial<CreateDeliveryChallanFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const patchLine = (id: string, partial: Partial<DeliveryChallanLineDraft>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lines: prev.lines.map((line) => (line.id === id ? { ...line, ...partial } : line)),
      };
    });
  };

  const removeLine = (id: string) => {
    setForm((prev) => (prev ? { ...prev, lines: prev.lines.filter((line) => line.id !== id) } : prev));
  };

  const handlePartySelect = (selected: SelectedInvoiceParty) => {
    setParty(selected);
    patchForm({
      shippingAddress: selected.billingAddress?.trim() || "",
    });
    setPartyModalOpen(false);
  };

  const handleAddItems = (picks: InventoryBillPick[]) => {
    setForm((prev) => {
      if (!prev) return prev;
      let lines = prev.lines;
      for (const pick of picks) {
        lines = mergeInventoryPickIntoChallanLines(lines, pick);
      }
      return { ...prev, lines };
    });
    setItemsModalOpen(false);
  };

  const loadInvoice = async (invoiceId: string) => {
    if (!orgId || !invoiceId.trim()) return;
    setLoadingInvoice(true);
    setError(null);
    try {
      const detail = await fetchSalesInvoiceDetail(orgId, invoiceId.trim());
      if (detail.partyId) {
        setParty({
          partyId: detail.partyId,
          name: detail.partyName,
          phone: detail.partyPhone,
          balance: 0,
        });
      }
      setForm((prev) =>
        prev
          ? {
              ...prev,
              invoiceId: detail.invoiceId,
              invoiceDisplayNumber: detail.displayNumber,
              shippingAddress: prev.shippingAddress,
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.deliveryChallans.create.loadInvoiceError"));
    } finally {
      setLoadingInvoice(false);
    }
  };

  const clearInvoice = () => {
    patchForm({ invoiceId: "", invoiceDisplayNumber: "", lines: [] });
  };

  const save = async (status: "draft" | "dispatched") => {
    if (!orgId || !form || !party?.partyId?.trim()) {
      setError(t("dashboard.deliveryChallans.create.validationParty"));
      return;
    }
    if (form.lines.length === 0) {
      setError(t("dashboard.deliveryChallans.create.validationItems"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = mapCreateDeliveryChallanFormToRequest(form, party.partyId.trim(), { status });
      const created = await createDeliveryChallan(orgId, payload);
      router.push(`/dashboard/sales/delivery-challan/${encodeURIComponent(created.deliveryChallanId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.deliveryChallans.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!orgId) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-brand-primary-muted">{t("dashboard.deliveryChallans.create.noOrganisation")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/sales/delivery-challan"
            className="text-sm font-medium text-brand-primary-muted hover:text-brand-primary"
          >
            ← {t("dashboard.deliveryChallans.backToList")}
          </Link>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.deliveryChallans.createTitle")}
          </h2>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-md border border-slate-200/90 bg-white p-4">
            <h3 className="text-sm font-semibold text-brand-primary">{t("dashboard.deliveryChallans.create.partySection")}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {party ? (
                <div>
                  <p className="font-medium text-brand-primary">{party.name}</p>
                  {party.phone ? <p className="text-sm text-brand-primary-muted">{party.phone}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-brand-primary-muted">{t("dashboard.deliveryChallans.create.noParty")}</p>
              )}
              <button
                type="button"
                onClick={() => setPartyModalOpen(true)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-slate-50"
              >
                {party ? t("dashboard.deliveryChallans.create.changeParty") : t("dashboard.deliveryChallans.create.selectParty")}
              </button>
            </div>
          </section>

          <section className="rounded-md border border-slate-200/90 bg-white p-4">
            <h3 className="text-sm font-semibold text-brand-primary">{t("dashboard.deliveryChallans.create.invoiceSection")}</h3>
            <p className="mt-1 text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.create.invoiceHint")}</p>
            {form?.invoiceId ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-semibold text-brand-primary">{form.invoiceDisplayNumber}</span>
                <button
                  type="button"
                  onClick={clearInvoice}
                  className="text-sm text-brand-primary-muted hover:text-brand-primary"
                >
                  {t("dashboard.deliveryChallans.create.clearInvoice")}
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <input
                  type="search"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder={t("dashboard.deliveryChallans.create.searchInvoice")}
                  className={inputSmClass}
                />
                {invoiceSearchLoading ? (
                  <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
                ) : invoiceOptions.length === 0 ? (
                  <p className="text-sm text-brand-primary-muted">{t("dashboard.deliveryChallans.create.noInvoices")}</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200/90">
                    {invoiceOptions.map((invoice) => (
                      <li key={invoice.invoiceId}>
                        <button
                          type="button"
                          disabled={loadingInvoice}
                          onClick={() => void loadInvoice(invoice.invoiceId)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                          <span>
                            <span className="font-mono font-semibold text-brand-primary">{invoice.displayNumber}</span>
                            <span className="ml-2 text-brand-primary-muted">{invoice.partyName}</span>
                          </span>
                          <span className="text-brand-primary-muted">{formatDate(invoice.invoiceDate)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-md border border-slate-200/90 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-brand-primary">{t("dashboard.deliveryChallans.create.itemsSection")}</h3>
              <button
                type="button"
                onClick={() => setItemsModalOpen(true)}
                className="rounded-md bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110"
              >
                + {t("dashboard.deliveryChallans.create.addItems")}
              </button>
            </div>

            {form && form.lines.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                      <th className="px-2 py-2">{t("dashboard.deliveryChallans.create.colItem")}</th>
                      <th className="px-2 py-2">{t("dashboard.deliveryChallans.create.colHsn")}</th>
                      <th className="px-2 py-2 text-right">{t("dashboard.deliveryChallans.create.colQty")}</th>
                      <th className="px-2 py-2">{t("dashboard.deliveryChallans.create.colSerial")}</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-50">
                        <td className="px-2 py-2">
                          <p className="font-medium text-brand-primary">{line.name}</p>
                          <p className="text-xs text-brand-primary-muted">{line.unit}</p>
                        </td>
                        <td className="px-2 py-2 text-brand-primary-mid">{line.hsn || "—"}</td>
                        <td className="px-2 py-2 text-right">
                          {line.serialised ? (
                            <span className="tabular-nums">{line.qty}</span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              value={line.qty}
                              onChange={(e) => patchLine(line.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                              className="h-8 w-20 rounded-md border border-slate-200 px-2 text-right text-sm"
                            />
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs text-brand-primary-muted">
                          {line.serialNumbers.length ? line.serialNumbers.join(", ") : "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            {t("dashboard.deliveryChallans.create.removeItem")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-brand-primary-muted">{t("dashboard.deliveryChallans.create.noItems")}</p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-slate-200/90 bg-white p-4">
            <h3 className="text-sm font-semibold text-brand-primary">{t("dashboard.deliveryChallans.create.detailsSection")}</h3>
            {form ? (
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.challanNumber")}
                  </span>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={form.challanPrefix}
                      onChange={(e) => patchForm({ challanPrefix: e.target.value })}
                      className={inputSmClass}
                    />
                    <input
                      value={form.challanNumber}
                      onChange={(e) => patchForm({ challanNumber: e.target.value })}
                      className={`${inputSmClass} max-w-[100px]`}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.challanDate")}
                  </span>
                  <input
                    type="date"
                    value={form.challanDate}
                    onChange={(e) => patchForm({ challanDate: e.target.value })}
                    className={`mt-1 ${inputSmClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.deliveryDate")}
                  </span>
                  <input
                    type="date"
                    value={form.deliveryDate}
                    onChange={(e) => patchForm({ deliveryDate: e.target.value })}
                    className={`mt-1 ${inputSmClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.shippingAddress")}
                  </span>
                  <textarea
                    value={form.shippingAddress}
                    onChange={(e) => patchForm({ shippingAddress: e.target.value })}
                    rows={3}
                    className={`mt-1 ${textareaClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.vehicleNumber")}
                  </span>
                  <input
                    value={form.vehicleNumber}
                    onChange={(e) => patchForm({ vehicleNumber: e.target.value })}
                    className={`mt-1 ${inputSmClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.transportRef")}
                  </span>
                  <input
                    value={form.transportRef}
                    onChange={(e) => patchForm({ transportRef: e.target.value })}
                    className={`mt-1 ${inputSmClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.create.notes")}
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => patchForm({ notes: e.target.value })}
                    rows={2}
                    className={`mt-1 ${textareaClass}`}
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="rounded-md border border-slate-200/90 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.deliveryChallans.create.totalQty")}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary">{totalQty}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={saving || !form}
                onClick={() => void save("draft")}
                className="h-10 rounded-md border border-slate-200 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
              >
                {saving ? t("dashboard.deliveryChallans.create.saving") : t("dashboard.deliveryChallans.create.saveDraft")}
              </button>
              <button
                type="button"
                disabled={saving || !form}
                onClick={() => void save("dispatched")}
                className="h-10 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              >
                {saving ? t("dashboard.deliveryChallans.create.saving") : t("dashboard.deliveryChallans.create.saveDispatch")}
              </button>
            </div>
            {form?.invoiceId ? (
              <p className="mt-3 text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.create.stockLinkedHint")}</p>
            ) : (
              <p className="mt-3 text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.create.stockHint")}</p>
            )}
          </section>
        </aside>
      </div>

      <PartySelectModal
        open={partyModalOpen}
        organisationId={orgId}
        onClose={() => setPartyModalOpen(false)}
        onSelect={handlePartySelect}
      />
      <AddItemsToBillModal
        open={itemsModalOpen}
        organisationId={orgId}
        onClose={() => setItemsModalOpen(false)}
        onAdd={handleAddItems}
      />
    </div>
  );
}
