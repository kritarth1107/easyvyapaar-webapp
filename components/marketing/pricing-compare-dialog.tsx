"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FeatureCategoryIcon,
  featureIconWrap,
  PLAN_COLUMN_META,
  PlanColumnHeader,
} from "@/lib/marketing/pricing-feature-icons";
import type { PlanFeatureSeed, PublicPricingComparisonRow, PublicPricingPlan } from "@/lib/types/pricing-api";

function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function CheckMark() {
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function CrossMark() {
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-500">
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function CompareCell({ cell }: { cell: PlanFeatureSeed }) {
  if (!cell.included) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-1">
        <CrossMark />
        {cell.note ? (
          <span className="text-[10px] leading-tight text-slate-400">{cell.note}</span>
        ) : null}
      </div>
    );
  }

  const value = cell.value?.trim();
  const isGeneric =
    !value ||
    /^included$/i.test(value) ||
    /^yes$/i.test(value) ||
    /^full\b/i.test(value);

  if (isGeneric || value === "Unlimited" || value?.includes("Unlimited")) {
    if (value && !/^included$/i.test(value)) {
      return (
        <div className="text-center">
          <p className="text-xs font-semibold leading-snug text-emerald-700">{value}</p>
          {cell.note ? <p className="mt-0.5 text-[10px] text-slate-500">{cell.note}</p> : null}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <CheckMark />
        {cell.note ? <span className="text-[10px] text-slate-500">{cell.note}</span> : null}
      </div>
    );
  }

  return (
    <div className="px-1 text-center">
      <p className="text-xs font-medium leading-snug text-brand-primary">{value}</p>
      {cell.note ? <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{cell.note}</p> : null}
    </div>
  );
}

type PricingCompareDialogProps = {
  open: boolean;
  rows: PublicPricingComparisonRow[];
  plans: PublicPricingPlan[];
  billing: "annual" | "monthly";
  onClose: () => void;
};

export function PricingCompareDialog({
  open,
  rows,
  plans,
  billing,
  onClose,
}: PricingCompareDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const priceByPlan = useMemo(() => {
    const map = new Map<string, string>();
    for (const plan of plans) {
      if (plan.isCustomPricing) {
        map.set(plan.planCode, "Custom quote");
        continue;
      }
      const paise = billing === "annual" ? plan.annualMonthlyPricePaise : plan.monthlyPricePaise;
      map.set(plan.planCode, `${formatInrFromPaise(paise)}/mo`);
    }
    return map;
  }, [plans, billing]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close pricing details"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-details-title"
        className="relative flex h-[min(92vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 id="pricing-details-title" className="text-lg font-bold text-brand-primary sm:text-xl">
            Pricing details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scrollbar-brand">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-white shadow-sm">
              <tr className="border-b border-slate-200">
                <th className="w-[34%] px-4 py-4 text-left align-bottom sm:px-6">
                  <span className="text-sm font-bold text-brand-primary">Compare plans</span>
                  <p className="mt-0.5 text-xs text-brand-primary-muted">
                    Every limit listed. Nothing hidden.
                  </p>
                </th>
                {PLAN_COLUMN_META.map((col) => (
                  <th
                    key={col.key}
                    className={`w-[16.5%] px-2 py-3 ${col.headerBg} border-l border-slate-100`}
                  >
                    <PlanColumnHeader
                      label={col.label}
                      crownClass={col.crown}
                      popular={col.popular}
                      priceLabel={priceByPlan.get(col.key) ?? "N/A"}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const prevCategory = rows[idx - 1]?.category;
                const showCategoryHeader = row.category !== prevCategory;

                return (
                  <Fragment key={`${row.category}-${row.label}`}>
                    {showCategoryHeader ? (
                      <tr className="bg-slate-50/90">
                        <td
                          colSpan={5}
                          className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 sm:px-6"
                        >
                          {row.category}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          {featureIconWrap(
                            row.category,
                            <FeatureCategoryIcon category={row.category} />,
                          )}
                          <span className="font-medium text-brand-primary">{row.label}</span>
                        </div>
                      </td>
                      {PLAN_COLUMN_META.map((col) => (
                        <td
                          key={col.key}
                          className={`border-l border-slate-100 px-2 py-3.5 align-middle ${col.headerBg}/40`}
                        >
                          <CompareCell cell={row.plans[col.key]} />
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-xs text-brand-primary-muted sm:px-6">
          Annual prices shown when &quot;Pay annually&quot; is selected on the pricing page. GST
          excluded.
        </div>
      </div>
    </div>,
    document.body,
  );
}
