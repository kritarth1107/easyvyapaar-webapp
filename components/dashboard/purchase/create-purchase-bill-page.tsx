"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { AddItemsToBillModal } from "@/components/dashboard/sales/add-items-to-bill-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import type { InventoryBillPick } from "@/lib/types/inventory-ui";
import { inputClass, inputSmClass, formatInr } from "@/lib/dashboard/page-utils";
import {
  createPurchaseBill,
  fetchNextPurchaseBillNumber,
  fetchPurchaseBillDetail,
  updatePurchaseBill,
} from "@/lib/purchase/purchases-api-client";
import { fetchParties } from "@/lib/parties/parties-api-client";
import type { PartySummary } from "@/lib/types/parties-api";
import type { CreatePurchaseBillRequest, PurchasePaymentMode } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

type LineRow = CreatePurchaseBillRequest["lineItems"][number] & { key: string };

/** Line total as stored by the API: inclusive rate already contains GST, exclusive adds it. */
function lineGross(line: LineRow): number {
  const base = line.qty * line.pricePerItem;
  const gst = Number(line.gstPercent) || 0;
  return line.purchaseTaxMode === "with_tax" ? base : base * (1 + gst / 100);
}

export function CreatePurchaseBillPage({ purchaseBillId }: { purchaseBillId?: string } = {}) {
  const isEdit = Boolean(purchaseBillId);
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";

  const [suppliers, setSuppliers] = useState<PartySummary[]>([]);
  const [partyId, setPartyId] = useState("");
  const [billPrefix, setBillPrefix] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineRow[]>([]);
  const [paymentType, setPaymentType] = useState<"paid" | "pending" | "partial">("pending");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PurchasePaymentMode>("cash");
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingBill, setLoadingBill] = useState(isEdit);

  useEffect(() => {
    if (!orgId || !purchaseBillId) return;
    fetchPurchaseBillDetail(orgId, purchaseBillId)
      .then((bill) => {
        setPartyId(bill.partyId);
        setBillPrefix(bill.billPrefix);
        setBillNumber(bill.billNumber);
        setBillDate(bill.billDate.slice(0, 10));
        setNotes(bill.notes ?? "");
        setLines(
          bill.lineItems.map((line) => ({
            key: `${line.lineId}-${Math.random()}`,
            itemId: line.itemId,
            name: line.name,
            qty: line.qty,
            pricePerItem: line.pricePerItem,
            unit: line.unit,
            hsn: line.hsn,
            gstPercent: line.gstPercent,
            discount: line.discount,
            discountType: line.discountType,
            purchaseTaxMode: line.purchaseTaxMode,
            ...(line.serialNumbers?.length ? { serialNumbers: line.serialNumbers } : {}),
          })),
        );
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t("dashboard.purchases.view.loadError")),
      )
      .finally(() => setLoadingBill(false));
  }, [orgId, purchaseBillId, t]);

  useEffect(() => {
    if (!orgId) return;
    fetchParties(orgId, { view: "suppliers", limit: 100, page: 1 })
      .then((data) => setSuppliers(data.items))
      .catch(() => setSuppliers([]));
    if (isEdit) return;
    fetchNextPurchaseBillNumber(orgId)
      .then((data) => {
        setBillPrefix(data.prefix);
        setBillNumber(data.number);
      })
      .catch(() => {});
  }, [orgId, isEdit]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + lineGross(line), 0),
    [lines],
  );

  const handleAddItems = (picks: InventoryBillPick[]) => {
    setLines((prev) => [
      ...prev,
      ...picks.map((pick) => ({
        key: `${pick.item.id}-${Date.now()}-${Math.random()}`,
        itemId: pick.item.id,
        name: pick.item.name,
        qty: 1,
        pricePerItem: pick.item.purchasePrice,
        unit: pick.item.unit,
        hsn: pick.item.hsn,
        gstPercent: pick.item.gstPercent ?? 0,
        discount: 0,
        discountType: "percent" as const,
        purchaseTaxMode: pick.item.purchaseTaxMode ?? ("without_tax" as const),
        ...(pick.serialNumbers?.length ? { serialNumbers: pick.serialNumbers } : {}),
      })),
    ]);
  };

  const handleSave = async () => {
    if (!orgId || !partyId || lines.length === 0) {
      setError(t("dashboard.purchases.create.validation"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && purchaseBillId) {
        const updated = await updatePurchaseBill(orgId, purchaseBillId, {
          partyId,
          billDate,
          notes: notes.trim() || null,
          lineItems: lines.map(({ key: _key, ...line }) => line),
        });
        router.push(`/dashboard/purchases/${updated.purchaseBillId}`);
        return;
      }
      const payload: CreatePurchaseBillRequest = {
        partyId,
        billPrefix,
        billNumber,
        billDate,
        notes: notes.trim() || undefined,
        lineItems: lines.map(({ key: _key, ...line }) => line),
        ...(paymentType === "paid"
          ? { paidAmount: total, paymentMode }
          : paymentType === "partial"
            ? { paidAmount: Number(paidAmount) || 0, paymentMode }
            : {}),
      };
      const bill = await createPurchaseBill(orgId, payload, pdfFile);
      router.push(`/dashboard/purchases/${bill.purchaseBillId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loadingBill) {
    return <div className="p-6 text-brand-primary-muted">{t("dashboard.purchases.create.loadingBill")}</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link href={isEdit && purchaseBillId ? `/dashboard/purchases/${purchaseBillId}` : "/dashboard/purchases"} className="text-sm font-semibold text-brand-orange-2 hover:underline">
          ← {t("dashboard.purchases.backToList")}
        </Link>
        <h2 className="mt-2 text-xl font-bold text-brand-primary lg:text-2xl">{isEdit ? t("dashboard.purchases.create.editTitle") : t("dashboard.purchases.createTitle")}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-sm border border-slate-200/90 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-brand-primary-muted">
                {t("dashboard.purchases.colSupplier")}
              </label>
              <ModernSelect
                value={partyId}
                onChange={setPartyId}
                options={[
                  { value: "", label: t("dashboard.purchases.create.selectSupplier") },
                  ...suppliers.map((s) => ({ value: s.partyId, label: s.name })),
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-brand-primary-muted">
                {t("dashboard.purchases.colDate")}
              </label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-brand-primary-muted">
                {t("dashboard.purchases.create.billNumber")}
              </label>
              <div className="flex gap-2">
                <input value={billPrefix} disabled={isEdit} onChange={(e) => setBillPrefix(e.target.value)} className={`${inputSmClass} w-20`} />
                <input value={billNumber} disabled={isEdit} onChange={(e) => setBillNumber(e.target.value)} className={inputSmClass} />
              </div>
            </div>
            {!isEdit ? (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-brand-primary-muted">
                {t("dashboard.purchases.create.attachment")}
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf,image/*"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className={inputClass}
              />
              {pdfFile ? (
                <div className="mt-1 flex items-center gap-2 text-xs text-brand-primary-muted">
                  <span className="truncate">{pdfFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="shrink-0 font-semibold text-brand-orange-2 hover:underline"
                  >
                    {t("dashboard.purchases.create.removeAttachment")}
                  </button>
                </div>
              ) : null}
            </div>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-primary">{t("dashboard.purchases.create.items")}</p>
              <button
                type="button"
                onClick={() => setAddItemsOpen(true)}
                className="text-sm font-semibold text-brand-orange-2 hover:underline"
              >
                + {t("dashboard.purchases.create.addItems")}
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-brand-primary-muted">
                {t("dashboard.purchases.create.noItems")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-[11px] uppercase text-brand-primary-muted">
                      <th className="py-2 text-left">{t("dashboard.purchases.create.colItem")}</th>
                      <th className="py-2 text-right">{t("dashboard.purchases.create.colQty")}</th>
                      <th className="py-2 text-right">{t("dashboard.purchases.create.colRate")}</th>
                      <th className="py-2 text-center">{t("dashboard.purchases.create.colTaxMode")}</th>
                      <th className="py-2 text-right">{t("dashboard.purchases.create.colGst")}</th>
                      <th className="py-2 text-right">{t("dashboard.purchases.create.colAmount")}</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.key} className="border-b border-slate-50">
                        <td className="py-2">{line.name}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min={1}
                            value={line.qty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((row) =>
                                  row.key === line.key ? { ...row, qty: Number(e.target.value) || 0 } : row,
                                ),
                              )
                            }
                            className={`${inputSmClass} w-20 text-right`}
                          />
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={line.pricePerItem}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((row) =>
                                  row.key === line.key ? { ...row, pricePerItem: Number(e.target.value) || 0 } : row,
                                ),
                              )
                            }
                            className={`${inputSmClass} w-24 text-right`}
                          />
                        </td>
                        <td className="py-2 text-center">
                          <button
                            type="button"
                            title={t("dashboard.purchases.create.taxToggleHint")}
                            onClick={() =>
                              setLines((prev) =>
                                prev.map((row) =>
                                  row.key === line.key
                                    ? {
                                        ...row,
                                        purchaseTaxMode:
                                          row.purchaseTaxMode === "with_tax" ? "without_tax" : "with_tax",
                                      }
                                    : row,
                                ),
                              )
                            }
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              line.purchaseTaxMode === "with_tax"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-brand-primary"
                            }`}
                          >
                            {line.purchaseTaxMode === "with_tax"
                              ? t("dashboard.purchases.create.taxIncl")
                              : t("dashboard.purchases.create.taxExcl")}
                          </button>
                        </td>
                        <td className="py-2 text-right tabular-nums">{Number(line.gstPercent) || 0}%</td>
                        <td className="py-2 text-right tabular-nums">{formatInr(lineGross(line))}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setLines((prev) => prev.filter((row) => row.key !== line.key))}
                            className="text-brand-primary-muted hover:text-red-600"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-brand-primary-muted">{t("dashboard.purchases.create.notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-slate-200/90 bg-white p-4">
            {!isEdit ? (
            <>
            <p className="text-sm font-semibold text-brand-primary">{t("dashboard.purchases.create.payment")}</p>
            <div className="mt-3 space-y-3">
              <ModernSelect
                value={paymentType}
                onChange={(v) => setPaymentType(v as typeof paymentType)}
                options={[
                  { value: "paid", label: t("dashboard.purchases.paymentPaid") },
                  { value: "pending", label: t("dashboard.purchases.paymentPending") },
                  { value: "partial", label: t("dashboard.purchases.paymentPartial") },
                ]}
              />
              {paymentType !== "pending" && (
                <>
                  {paymentType === "partial" && (
                    <input
                      type="number"
                      min={0}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder={t("dashboard.purchases.create.paidAmount")}
                      className={inputClass}
                    />
                  )}
                  <ModernSelect
                    value={paymentMode}
                    onChange={(v) => setPaymentMode(v as PurchasePaymentMode)}
                    options={[
                      { value: "cash", label: t("dashboard.purchases.create.modeCash") },
                      { value: "upi", label: t("dashboard.purchases.create.modeUpi") },
                      { value: "bank", label: t("dashboard.purchases.create.modeBank") },
                      { value: "card", label: t("dashboard.purchases.create.modeCard") },
                      { value: "cheque", label: t("dashboard.purchases.create.modeCheque") },
                    ]}
                  />
                </>
              )}
            </div>
            </>
            ) : null}
            <p className="mt-4 text-lg font-bold text-brand-primary">{formatInr(total)}</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="mt-4 w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {saving
                ? t("dashboard.purchases.create.saving")
                : isEdit
                  ? t("dashboard.purchases.create.updateBill")
                  : t("dashboard.purchases.create.saveBill")}
            </button>
          </div>
        </div>
      </div>

      <AddItemsToBillModal
        open={addItemsOpen}
        organisationId={orgId}
        onClose={() => setAddItemsOpen(false)}
        onAdd={handleAddItems}
      />
    </div>
  );
}
