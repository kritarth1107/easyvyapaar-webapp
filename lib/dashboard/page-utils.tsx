"use client";

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:ring-2 focus:ring-brand-primary/[0.08]";

export const inputSmClass =
  "h-9 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

export const tableClass = "w-full text-sm text-brand-primary";
export const tableHeadRowClass =
  "border-b border-slate-200 bg-brand-surface/60 text-[11px] font-semibold uppercase tracking-wide text-slate-600";
export const tableHeadCellClass = "px-4 py-3";
export const tableBodyRowClass = "border-b border-slate-100 text-brand-primary";
export const tableBodyCellClass = "px-4 py-3 text-brand-primary";
