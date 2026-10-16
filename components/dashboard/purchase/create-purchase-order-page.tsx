"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { AddItemsToBillModal } from "@/components/dashboard/sales/add-items-to-bill-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import type { InventoryBillPick } from "@/lib/types/inventory-ui";
import { inputClass, inputSmClass, formatInr } from "@/lib/dashboard/page-utils";
import { createPurchaseOrder, fetchNextPurchaseOrderNumber } from "@/lib/purchase/purchases-api-client";
import { fetchParties } from "@/lib/parties/parties-api-client";
import type { PartySummary } from "@/lib/types/parties-api";
import type { CreatePurchaseOrderRequest } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

type LineRow = CreatePurchaseOrderRequest["lineItems"][number] & { key: string };

function lineGross(line: LineRow): number {
  const base = line.qty * line.pricePerItem;
  const gst = Number(line.gstPercent) || 0;
  return line.purchaseTaxMode === "with_tax" ? base : base * (1 + gst / 100);
}

export function CreatePurchaseOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [suppliers, setSuppliers] = useState<PartySummary[]>([]);
  const [partyId, setPartyId] = useState("");
  const [orderPrefix, setOrderPrefix] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineRow[]>([]);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchParties(orgId, { view: "suppliers", limit: 100, page: 1 }).then((d) => setSuppliers(d.items)).catch(() => setSuppliers([]));
    fetchNextPurchaseOrderNumber(orgId).then((d) => { setOrderPrefix(d.prefix); setOrderNumber(d.number); }).catch(() => {});
  }, [orgId]);

  const total = lines.reduce((s, l) => s + lineGross(l), 0);

  const handleAddItems = (picks: InventoryBillPick[]) => {
    setLines((prev) => [...prev, ...picks.map((pick) => ({
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
    }))]);
  };

  const handleSave = async () => {
    if (!orgId || !partyId || lines.length === 0) { setError(t("dashboard.purchases.create.validation")); return; }
    setSaving(true);
    try {
      const order = await createPurchaseOrder(orgId, {
        partyId, orderPrefix, orderNumber, orderDate,
        lineItems: lines.map(({ key: _k, ...line }) => line),
      });
      router.push(`/dashboard/purchases/purchase-orders/${order.purchaseOrderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/purchases/purchase-orders" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.purchases.backToOrders")}</Link>
      <h2 className="mt-2 text-xl font-bold">{t("dashboard.purchases.createOrderTitle")}</h2>
      <div className="mt-4 grid gap-4 rounded-xl border border-slate-200/90 bg-white shadow-sm p-4 lg:grid-cols-2">
        <ModernSelect value={partyId} onChange={setPartyId} options={[{ value: "", label: t("dashboard.purchases.create.selectSupplier") }, ...suppliers.map((s) => ({ value: s.partyId, label: s.name }))]} />
        <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={inputClass} />
        <button type="button" onClick={() => setAddItemsOpen(true)} className="text-sm font-semibold text-brand-orange-2">+ {t("dashboard.purchases.create.addItems")}</button>
      </div>
      {lines.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <table className="w-full text-sm"><tbody>{lines.map((line) => (<tr key={line.key} className="border-b"><td className="px-4 py-2">{line.name}</td><td className="px-4 py-2 text-center"><button type="button" title={t("dashboard.purchases.create.taxToggleHint")} onClick={() => setLines((prev) => prev.map((row) => row.key === line.key ? { ...row, purchaseTaxMode: row.purchaseTaxMode === "with_tax" ? "without_tax" : "with_tax" } : row))} className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${line.purchaseTaxMode === "with_tax" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-brand-primary"}`}>{line.purchaseTaxMode === "with_tax" ? t("dashboard.purchases.create.taxIncl") : t("dashboard.purchases.create.taxExcl")}</button></td><td className="px-4 py-2 text-right tabular-nums">{Number(line.gstPercent) || 0}% GST</td><td className="px-4 py-2 text-right">{formatInr(lineGross(line))}</td></tr>))}</tbody></table>
          <p className="px-4 py-3 text-right font-bold">{formatInr(total)}</p>
        </div>
      )}
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <button type="button" disabled={saving} onClick={() => void handleSave()} className="mt-4 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white">{saving ? t("dashboard.purchases.create.saving") : t("dashboard.purchases.create.saveOrder")}</button>
      <AddItemsToBillModal open={addItemsOpen} organisationId={orgId} onClose={() => setAddItemsOpen(false)} onAdd={handleAddItems} />
    </div>
  );
}
