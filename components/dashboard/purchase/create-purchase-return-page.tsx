"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { inputClass, inputSmClass, formatInr } from "@/lib/dashboard/page-utils";
import {
  createPurchaseReturn,
  fetchNextPurchaseReturnNumber,
  fetchPurchaseBillDetail,
  fetchPurchaseBills,
} from "@/lib/purchase/purchases-api-client";
import type { PurchaseBillDetail, PurchaseBillSummary } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

export function CreatePurchaseReturnPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [bills, setBills] = useState<PurchaseBillSummary[]>([]);
  const [billId, setBillId] = useState("");
  const [bill, setBill] = useState<PurchaseBillDetail | null>(null);
  const [returnPrefix, setReturnPrefix] = useState("");
  const [returnNumber, setReturnNumber] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchPurchaseBills(orgId, { limit: 100, page: 1 }).then((d) => setBills(d.items)).catch(() => setBills([]));
    fetchNextPurchaseReturnNumber(orgId).then((d) => { setReturnPrefix(d.prefix); setReturnNumber(d.number); }).catch(() => {});
  }, [orgId]);

  useEffect(() => {
    if (!orgId || !billId) { setBill(null); return; }
    fetchPurchaseBillDetail(orgId, billId).then(setBill).catch(() => setBill(null));
  }, [orgId, billId]);

  const handleSave = async () => {
    if (!orgId || !billId || !bill) return;
    const lineItems = bill.lineItems
      .filter((line) => (qtyMap[line.lineId] ?? 0) > 0)
      .map((line) => ({
        billLineId: line.lineId,
        itemId: line.itemId,
        name: line.name,
        qty: qtyMap[line.lineId] ?? 0,
        pricePerItem: line.pricePerItem,
        hsn: line.hsn,
        unit: line.unit,
        gstPercent: line.gstPercent,
        discount: line.discount,
        discountType: line.discountType,
        purchaseTaxMode: line.purchaseTaxMode,
      }));
    if (lineItems.length === 0) { setError(t("dashboard.purchases.create.validation")); return; }
    setSaving(true);
    try {
      const ret = await createPurchaseReturn(orgId, {
        purchaseBillId: billId,
        returnPrefix,
        returnNumber,
        returnDate,
        reason: reason.trim() || undefined,
        lineItems,
      });
      router.push("/dashboard/purchases/purchase-returns");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/purchases/purchase-returns" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.purchases.backToReturns")}</Link>
      <h2 className="mt-2 text-xl font-bold">{t("dashboard.purchases.createReturnTitle")}</h2>
      <div className="mt-4 space-y-4 rounded-xl border border-slate-200/90 bg-white shadow-sm p-4">
        <ModernSelect value={billId} onChange={setBillId} options={[{ value: "", label: t("dashboard.purchases.create.selectBill") }, ...bills.map((b) => ({ value: b.purchaseBillId, label: `${b.displayNumber} — ${b.partyName}` }))]} />
        <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputClass} />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("dashboard.purchases.create.reason")} className={inputClass} />
        {bill && (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-[11px] uppercase"><th className="py-2 text-left">{t("dashboard.purchases.create.colItem")}</th><th className="py-2 text-right">{t("dashboard.purchases.create.colQty")}</th><th className="py-2 text-right">{t("dashboard.purchases.create.returnQty")}</th></tr></thead>
            <tbody>{bill.lineItems.map((line) => (<tr key={line.lineId} className="border-b"><td className="py-2">{line.name}</td><td className="py-2 text-right">{line.qty}</td><td className="py-2 text-right"><input type="number" min={0} max={line.qty} value={qtyMap[line.lineId] ?? 0} onChange={(e) => setQtyMap((m) => ({ ...m, [line.lineId]: Number(e.target.value) || 0 }))} className={`${inputSmClass} w-20 text-right`} /></td></tr>))}</tbody>
          </table>
        )}
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" disabled={saving} onClick={() => void handleSave()} className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white">{saving ? t("dashboard.purchases.create.saving") : t("dashboard.purchases.create.saveReturn")}</button>
      </div>
    </div>
  );
}
