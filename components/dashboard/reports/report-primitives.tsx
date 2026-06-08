"use client";

import {
  formatDate,
  formatInr,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
import type {
  ReportChart,
  ReportColumn,
  ReportMetric,
  ReportRow,
  ReportSection,
  ReportTable,
} from "@/lib/types/reports-api";

function formatValue(value: string | number | null | undefined, format?: ReportColumn["format"]): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "currency" && typeof value === "number") return formatInr(value);
  if (format === "number" && typeof value === "number") return value.toLocaleString("en-IN");
  if (format === "date" && typeof value === "string") return formatDate(value);
  return String(value);
}

const METRIC_TONE: Record<NonNullable<ReportMetric["tone"]>, string> = {
  default: "border-slate-200/90 bg-white",
  positive: "border-emerald-200/80 bg-emerald-50/50",
  negative: "border-red-200/80 bg-red-50/40",
  warning: "border-amber-200/80 bg-amber-50/50",
};

export function ReportMetricCards({ metrics, title }: { metrics: ReportMetric[]; title?: string }) {
  return (
    <div>
      {title ? <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-primary-muted">{title}</h3> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-xl border p-4 shadow-sm ${METRIC_TONE[m.tone ?? "default"]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">{m.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-brand-primary">
              {formatValue(m.value, m.format)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportInfoStrip({ items, title }: { items: { label: string; value: string }[]; title?: string }) {
  return (
    <div className={`${tablePanelClass} px-4 py-3`}>
      {title ? <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-primary-muted">{title}</p> : null}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-primary">
        {items.map((item) => (
          <span key={item.label}>
            <span className="font-medium text-brand-primary-muted">{item.label}: </span>
            {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReportBarChart({ chart }: { chart: ReportChart }) {
  const max = Math.max(...chart.bars.map((b) => b.value), 1);
  return (
    <div className={`${tablePanelClass} p-4`}>
      <h3 className="mb-4 text-sm font-bold text-brand-primary">{chart.title}</h3>
      <div className="space-y-3">
        {chart.bars.map((bar) => {
          const pct = Math.max(2, (bar.value / max) * 100);
          return (
            <div key={bar.label} className="grid grid-cols-[7rem_1fr_6rem] items-center gap-3 text-sm">
              <span className="truncate font-medium text-brand-primary-muted">{bar.label}</span>
              <div className="h-6 overflow-hidden rounded-md bg-slate-100">
                <div
                  className="h-full rounded-md transition-all"
                  style={{ width: `${pct}%`, backgroundColor: bar.color ?? "#2563eb" }}
                />
              </div>
              <span className="text-right font-semibold tabular-nums text-brand-primary">
                {formatValue(bar.value, chart.format ?? "currency")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportComparison({
  title,
  left,
  right,
}: {
  title?: string;
  left: { label: string; items: ReportMetric[] };
  right: { label: string; items: ReportMetric[] };
}) {
  return (
    <div className={`${tablePanelClass} p-4`}>
      {title ? <h3 className="mb-4 text-sm font-bold text-brand-primary">{title}</h3> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {[left, right].map((side) => (
          <div key={side.label} className="rounded-lg border border-slate-200/90 bg-slate-50/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-primary-muted">{side.label}</p>
            <div className="space-y-2">
              {side.items.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <span className="text-brand-primary-muted">{m.label}</span>
                  <span className="font-semibold tabular-nums text-brand-primary">
                    {formatValue(m.value, m.format)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportDataTable({ table }: { table: ReportTable }) {
  return (
    <div className={tablePanelClass}>
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-brand-primary">{table.title}</h3>
        <p className="text-xs text-brand-primary-muted">{table.rows.length} rows</p>
      </div>
      {table.rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-brand-primary-muted">No rows in this section.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[640px]`}>
            <thead>
              <tr className={tableHeadRowClass}>
                {table.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${tableHeadCellClass} ${col.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, idx) => (
                <tr key={idx} className={tableBodyRowClass}>
                  {table.columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${tableBodyCellClass} ${col.align === "right" ? "text-right tabular-nums" : ""}`}
                    >
                      {formatValue(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {table.footer && Object.keys(table.footer).length > 0 ? (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-primary">
                {Object.entries(table.footer).map(([key, value]) => (
                  <span key={key}>
                    <span className="font-medium text-brand-primary-muted">{humanizeKey(key)}: </span>
                    {typeof value === "number" ? formatInr(value) : String(value)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function ReportSectionView({ section }: { section: ReportSection }) {
  switch (section.type) {
    case "metrics":
      return <ReportMetricCards metrics={section.metrics} title={section.title} />;
    case "info":
      return <ReportInfoStrip items={section.items} title={section.title} />;
    case "chart":
      return <ReportBarChart chart={section.chart} />;
    case "comparison":
      return <ReportComparison title={section.title} left={section.left} right={section.right} />;
    case "table":
      return <ReportDataTable table={section.table} />;
    default:
      return null;
  }
}
