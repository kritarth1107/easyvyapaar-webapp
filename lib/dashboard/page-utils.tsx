"use client";

import { formatDateIndian } from "@/lib/dashboard/date-format";
import { inputControlClass, inputControlSmClass } from "@/lib/ui/control-styles";

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return formatDateIndian(iso);
  return iso;
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "navy" | "green" | "amber" | "blue";
}) {
  const ring =
    accent === "green"
      ? "border-emerald-200/80 bg-emerald-50/30"
      : accent === "amber"
        ? "border-amber-200/80 bg-amber-50/30"
        : accent === "blue"
          ? "border-blue-200/80 bg-blue-50/30"
          : accent === "navy"
            ? "border-brand-primary/15 bg-brand-primary/[0.03]"
            : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-3.5 py-3 ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
    </div>
  );
}

/** Card / panel — always set border color (bare `border` renders black in Tailwind v4). */
export const panelClass = "rounded-xl border border-slate-200/90 bg-white shadow-sm";
export const formPanelClass = "rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm lg:p-5";
export const tablePanelClass = "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const inputClass = inputControlClass;

export const inputSmClass = inputControlSmClass;

export const tableClass = "w-full text-sm text-brand-primary";
export const tableHeadRowClass =
  "border-b border-slate-200 bg-brand-surface/60 text-[11px] font-semibold uppercase tracking-wide text-slate-600";
export const tableHeadCellClass = "px-4 py-3";
export const tableBodyRowClass = "border-b border-slate-100 text-brand-primary";
export const tableBodyCellClass = "px-4 py-3 text-brand-primary";
