"use client";

import { formatInr2 } from "@/components/dashboard/purchase/purchase-bill-summary";
import {
  PURCHASE_TDS_SECTIONS,
  type PurchaseBillDetail,
  type PurchaseBillTdsInput,
  type PurchaseTdsSection,
} from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

export type TdsFormState = {
  enabled: boolean;
  section: PurchaseTdsSection;
  sectionLabel: string;
  rate: string;
  /** Empty = backend default (taxable value excl. GST). */
  baseAmount: string;
};

export const EMPTY_TDS_FORM: TdsFormState = {
  enabled: false,
  section: "194C",
  sectionLabel: "",
  rate: "",
  baseAmount: "",
};

/** Common default rates (individual/HUF vs others differ for 194C; user can override). */
export const TDS_DEFAULT_RATES: Partial<Record<PurchaseTdsSection, number>> = {
  "194C": 1,
  "194H": 2,
  "194I": 10,
  "194J": 10,
  "194Q": 0.1,
  "194A": 10,
  "194O": 0.1,
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function tdsFormFromBill(bill: PurchaseBillDetail): TdsFormState {
  if (!bill.tdsRate || bill.tdsRate <= 0) return EMPTY_TDS_FORM;
  const known = (PURCHASE_TDS_SECTIONS as readonly string[]).includes(bill.tdsSection ?? "");
  return {
    enabled: true,
    section: known ? (bill.tdsSection as PurchaseTdsSection) : "other",
    sectionLabel: known ? "" : (bill.tdsSection ?? ""),
    rate: String(bill.tdsRate),
    baseAmount: bill.tdsBaseOverridden ? String(bill.tdsBaseAmount) : "",
  };
}

export function tdsFormToInput(form: TdsFormState): PurchaseBillTdsInput | null {
  const rate = Number(form.rate);
  if (!form.enabled || !Number.isFinite(rate) || rate <= 0) return null;
  const base = form.baseAmount.trim() === "" ? undefined : Number(form.baseAmount);
  return {
    section: form.section,
    ...(form.section === "other" && form.sectionLabel.trim() ? { sectionLabel: form.sectionLabel.trim() } : {}),
    rate,
    ...(base !== undefined && Number.isFinite(base) && base >= 0 ? { baseAmount: base } : {}),
  };
}

/** Mirrors backend calcPurchaseTds: base defaults to taxable value; TDS never exceeds the bill total. */
export function calcLiveTds(form: TdsFormState, total: number, taxable: number) {
  const input = tdsFormToInput(form);
  if (!input) return { tdsAmount: 0, base: 0, netPayable: round2(total) };
  const base = round2(input.baseAmount ?? taxable);
  const tdsAmount = Math.min(round2(total), round2((base * input.rate) / 100));
  return { tdsAmount, base, netPayable: round2(total - tdsAmount) };
}

const fieldClass =
  "h-9 w-full rounded-sm border border-slate-200 bg-white px-2 text-sm text-brand-primary outline-none focus:border-brand-primary";

export function PurchaseTdsFields({
  value,
  onChange,
  total,
  taxable,
}: {
  value: TdsFormState;
  onChange: (next: TdsFormState) => void;
  total: number;
  taxable: number;
}) {
  const { t } = useTranslation();
  const live = calcLiveTds(value, total, taxable);
  return (
    <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
      <label className="flex items-center gap-2 font-semibold text-brand-primary">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) =>
            onChange({
              ...value,
              enabled: e.target.checked,
              rate: value.rate || String(TDS_DEFAULT_RATES[value.section] ?? ""),
            })
          }
        />
        {t("dashboard.purchaseSummary.tdsToggle")}
      </label>
      {value.enabled ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-brand-primary-muted">
              <span className="mb-1 block">{t("dashboard.purchaseSummary.tdsSection")}</span>
              <select
                className={fieldClass}
                value={value.section}
                onChange={(e) => {
                  const section = e.target.value as PurchaseTdsSection;
                  onChange({ ...value, section, rate: String(TDS_DEFAULT_RATES[section] ?? value.rate) });
                }}
              >
                {PURCHASE_TDS_SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section === "other" ? t("dashboard.purchaseSummary.tdsOther") : section}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-brand-primary-muted">
              <span className="mb-1 block">{t("dashboard.purchaseSummary.tdsRate")}</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                className={fieldClass}
                value={value.rate}
                onChange={(e) => onChange({ ...value, rate: e.target.value })}
              />
            </label>
          </div>
          {value.section === "other" ? (
            <input
              className={fieldClass}
              maxLength={20}
              placeholder={t("dashboard.purchaseSummary.tdsSectionLabel")}
              value={value.sectionLabel}
              onChange={(e) => onChange({ ...value, sectionLabel: e.target.value })}
            />
          ) : null}
          <label className="block text-xs font-semibold text-brand-primary-muted">
            <span className="mb-1 block">{t("dashboard.purchaseSummary.tdsBase")}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className={fieldClass}
              placeholder={formatInr2(taxable)}
              value={value.baseAmount}
              onChange={(e) => onChange({ ...value, baseAmount: e.target.value })}
            />
            <span className="mt-1 block font-normal">{t("dashboard.purchaseSummary.tdsBaseHint")}</span>
          </label>
          <div className="flex justify-between text-red-700">
            <span>{t("dashboard.purchaseSummary.tdsAmount")}</span>
            <span className="tabular-nums">−{formatInr2(live.tdsAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-brand-primary">
            <span>{t("dashboard.purchaseSummary.netPayable")}</span>
            <span className="tabular-nums">{formatInr2(live.netPayable)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
