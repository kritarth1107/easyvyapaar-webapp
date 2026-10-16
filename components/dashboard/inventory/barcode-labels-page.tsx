"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { useAllInventoryItems } from "@/lib/inventory/use-inventory-items";
import {
  printBarcodeLabels,
  renderBarcodeSvg,
  type BarcodeLabelLayout,
} from "@/lib/inventory/barcode-labels";
import { formatInr } from "@/lib/sales/create-invoice-form";
import { useTranslation } from "@/lib/localization";
import type { InventoryItem } from "@/lib/types/inventory-ui";

type BarcodeLabelsPageProps = {
  initialItemIds?: string[];
};

const EMPTY_PARAMS = {};

function BarcodePreview({ value }: { value: string }) {
  const svg = useMemo(() => renderBarcodeSvg(value, { height: 36 }), [value]);
  if (!svg) return <span className="font-mono text-xs text-red-600">{value || "—"}</span>;
  return <span className="block h-12 w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function BarcodeLabelsPage({ initialItemIds = [] }: BarcodeLabelsPageProps) {
  const { t } = useTranslation();
  const { activeOrganisationId, activeOrganisation } = useUserMe();
  const { items, loading, error } = useAllInventoryItems(activeOrganisationId, EMPTY_PARAMS);
  const [query, setQuery] = useState("");
  // Items preselected via ?ids= start with 1 label each; unknown ids are simply ignored.
  const [copies, setCopies] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialItemIds.map((id) => [id, 1])),
  );
  const [layout, setLayout] = useState<BarcodeLabelLayout>("a4-21");
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.hsn.toLowerCase().includes(q),
    );
  }, [items, query]);

  const selected = useMemo(
    () => items.filter((item) => (copies[item.id] ?? 0) > 0),
    [items, copies],
  );
  const totalLabels = selected.reduce((sum, item) => sum + (copies[item.id] ?? 0), 0);
  const missingCode = selected.filter((item) => !item.sku.trim());

  const toggle = (item: InventoryItem) =>
    setCopies((prev) => {
      const next = { ...prev };
      if ((next[item.id] ?? 0) > 0) delete next[item.id];
      else next[item.id] = 1;
      return next;
    });

  const setQty = (id: string, value: number) =>
    setCopies((prev) => ({ ...prev, [id]: Math.max(0, Math.min(500, Math.floor(value) || 0)) }));

  const handlePrint = () => {
    const entries = selected
      .filter((item) => item.sku.trim())
      .map((item) => ({
        name: item.name,
        code: item.sku,
        price: formatInr(item.salePrice),
        copies: copies[item.id] ?? 0,
      }));
    if (entries.length === 0) return;
    printBarcodeLabels(entries, {
      layout,
      showName,
      showPrice,
      priceLabel: t("dashboard.barcodeLabels.priceLabel"),
      businessName: activeOrganisation?.name,
    });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard/inventory/items"
            className="text-sm font-medium text-brand-primary-muted hover:underline"
          >
            ← {t("dashboard.nav.items")}
          </Link>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.barcodeLabels.title")}
          </h2>
          <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.barcodeLabels.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          disabled={totalLabels === 0 || selected.length === missingCode.length}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {t("dashboard.barcodeLabels.printLabels")} ({totalLabels})
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200/80 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-brand-primary-muted">
            {t("dashboard.barcodeLabels.layout")}
          </p>
          <ModernSelect
            value={layout}
            onChange={(value) => setLayout(value as BarcodeLabelLayout)}
            options={[
              { value: "a4-21", label: t("dashboard.barcodeLabels.layoutA4_21") },
              { value: "a4-40", label: t("dashboard.barcodeLabels.layoutA4_40") },
              { value: "roll-50x25", label: t("dashboard.barcodeLabels.layoutRoll50") },
              { value: "roll-38x25", label: t("dashboard.barcodeLabels.layoutRoll38") },
            ]}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-primary">
          <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
          {t("dashboard.barcodeLabels.showName")}
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-primary">
          <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
          {t("dashboard.barcodeLabels.showPrice")}
        </label>
      </div>

      {missingCode.length > 0 && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.barcodeLabels.missingCode")}: {missingCode.map((item) => item.name).join(", ")}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-sm border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">
          {t("dashboard.inventory.loadError")}
        </p>
      )}

      <div className="rounded-lg border border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.inventory.searchPlaceholder")}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-brand-primary"
            autoFocus
          />
        </div>
        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">{t("dashboard.inventory.colItem")}</th>
                <th className="px-4 py-3">{t("dashboard.barcodeLabels.colCode")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.inventory.colPrice")}</th>
                <th className="w-48 px-4 py-3">{t("dashboard.barcodeLabels.colPreview")}</th>
                <th className="w-32 px-4 py-3 text-right">{t("dashboard.barcodeLabels.colCopies")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {t("dashboard.inventory.loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {t("dashboard.inventory.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const qty = copies[item.id] ?? 0;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={qty > 0}
                          onChange={() => toggle(item)}
                          aria-label={item.name}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-primary">{item.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.sku || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatInr(item.salePrice)}</td>
                      <td className="px-4 py-2">{qty > 0 ? <BarcodePreview value={item.sku} /> : null}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={qty}
                          onChange={(e) => setQty(item.id, Number(e.target.value))}
                          className="h-9 w-20 rounded-md border border-slate-200 px-2 text-right tabular-nums"
                          aria-label={t("dashboard.barcodeLabels.colCopies")}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
