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
} from "@/lib/purchase/purchases-api-client";
import { fetchParties } from "@/lib/parties/parties-api-client";
import type { PartySummary } from "@/lib/types/parties-api";
import type { CreatePurchaseBillRequest, PurchasePaymentMode } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

type LineRow = CreatePurchaseBillRequest["lineItems"][number] & { key: string };

export function CreatePurchaseBillPage() {
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

  useEffect(() => {
    if (!orgId) return;
    fetchParties(orgId, { view: "suppliers", limit: 100, page: 1 })
      .then((data) => setSuppliers(data.items))
      .catch(() => setSuppliers([]));
    fetchNextPurchaseBillNumber(orgId)
      .then((data) => {
        setBillPrefix(data.prefix);
        setBillNumber(data.number);
      })
      .catch(() => {});
  }, [orgId]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty * line.pricePerItem, 0),
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
        purchaseTaxMode: "with_tax" as const,
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

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link href="/dashboard/purchases" className="text-sm font-semibold text-brand-orange-2 hover:underline">
          ← {t("dashboard.purchases.backToList")}
        </Link>
        <h2 className="mt-2 text-xl font-bold text-brand-primary lg:text-2xl">{t("dashboard.purchases.createTitle")}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-md border border-slate-200/90 bg-white p-4">
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
                <input value={billPrefix} onChange={(e) => setBillPrefix(e.target.value)} className={`${inputSmClass} w-20`} />
                <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className={inputSmClass} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-brand-primary-muted">
                {t("dashboard.purchases.create.attachment")}
              </label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} className={inputClass} />
            </div>
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
                        <td className="py-2 text-right tabular-nums">{formatInr(line.qty * line.pricePerItem)}</td>
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
          <div className="rounded-md border border-slate-200/90 bg-white p-4">
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
            <p className="mt-4 text-lg font-bold text-brand-primary">{formatInr(total)}</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="mt-4 w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {saving ? t("dashboard.purchases.create.saving") : t("dashboard.purchases.create.saveBill")}
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
