"use client";

import { useMemo } from "react";
import { formatDateIndian } from "@/lib/dashboard/date-format";
import {
  formatInr,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
import type { ProfitLossDelta, ProfitLossReport } from "@/lib/reports/profit-loss-types";
import { useTranslation } from "@/lib/localization";

const PIE_COLORS = ["#dc2626", "#d97706", "#2563eb", "#7c3aed", "#059669", "#64748b"];

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const ring =
    tone === "positive"
      ? "border-emerald-200/80 bg-emerald-50/40"
      : tone === "negative"
        ? "border-red-200/80 bg-red-50/40"
        : "border-slate-200/90 bg-white";
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-brand-primary">{value}</p>
      {sub ? <p className="mt-1 text-xs text-brand-primary-muted">{sub}</p> : null}
    </div>
  );
}

function DeltaBadge({ delta }: { delta: ProfitLossDelta }) {
  const up = delta.change >= 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${up ? "text-emerald-700" : "text-red-600"}`}>
      {up ? "▲" : "▼"} {formatInr(Math.abs(delta.change))} ({delta.changePercent.toFixed(1)}%)
    </span>
  );
}

function ProfitLossPieChart({ report }: { report: ProfitLossReport }) {
  const slices = useMemo(() => {
    const cogs = Math.max(0, report.cogs.costOfGoodsSold);
    const opex = Math.max(0, report.operatingExpenses.totalOpEx);
    const dep = Math.max(0, report.belowTheLine.depreciation);
    const interest = Math.max(0, report.belowTheLine.interestExpense);
    const pat = Math.max(0, report.netProfit);
    return [
      { label: "COGS", value: cogs, color: PIE_COLORS[0] },
      { label: "Operating expenses", value: opex, color: PIE_COLORS[1] },
      { label: "Depreciation", value: dep, color: PIE_COLORS[2] },
      { label: "Interest", value: interest, color: PIE_COLORS[3] },
      { label: "Net profit (PAT)", value: pat, color: PIE_COLORS[4] },
    ].filter((s) => s.value > 0);
  }, [report]);

  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;

  return (
    <div className={`${tablePanelClass} p-5`}>
      <h3 className="text-sm font-bold text-brand-primary">Net revenue allocation</h3>
      <p className="mt-0.5 text-xs text-brand-primary-muted">Where your ex-GST net revenue was consumed</p>
      <div className="mt-4 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <svg viewBox="0 0 42 42" className="h-44 w-44 shrink-0 -rotate-90">
          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
          {slices.map((slice) => {
            const pct = (slice.value / total) * 100;
            const dash = `${pct} ${100 - pct}`;
            const offset = 25 - cumulative;
            cumulative += pct;
            return (
              <circle
                key={slice.label}
                cx="21"
                cy="21"
                r="15.9"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="6"
                strokeDasharray={dash}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="w-full flex-1 space-y-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-brand-primary">{slice.label}</span>
              </span>
              <span className="font-semibold tabular-nums text-brand-primary">
                {formatInr(slice.value)} ({((slice.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-2 text-sm font-bold text-brand-primary">
            Net revenue: {formatInr(report.revenue.netRevenue)}
          </div>
        </div>
      </div>
    </div>
  );
}

function exportProfitLossCsv(report: ProfitLossReport) {
  const lines = [
    ["Profit & Loss Statement", report.fromDate ?? "", report.toDate ?? ""],
    [],
    ["Line item", "Amount"],
    ...report.statement.map((r) => [r.line, String(r.amount)]),
    [],
    ["Category", "Net revenue", "COGS", "Gross profit", "Contribution %"],
    ...report.categoryWise.map((c) => [
      c.categoryName,
      String(c.netRevenue),
      String(c.cogs),
      String(c.grossProfit),
      String(c.contributionPercent),
    ]),
  ];
  const csv = lines.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `profit-loss-${report.fromDate ?? "report"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProfitLossReportView({ report }: { report: ProfitLossReport }) {
  const { t } = useTranslation();
  const period =
    report.fromDate && report.toDate
      ? `${formatDateIndian(report.fromDate)} — ${formatDateIndian(report.toDate)}`
      : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-primary-muted">
          {t("dashboard.reports.profitLoss.exGstNote")} · {period}
        </p>
        <button
          type="button"
          onClick={() => exportProfitLossCsv(report)}
          className="h-9 rounded-lg border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
        >
          {t("dashboard.reports.profitLoss.exportCsv")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("dashboard.reports.profitLoss.kpi.netRevenue")}
          value={formatInr(report.revenue.netRevenue)}
          sub={`${t("dashboard.reports.profitLoss.kpi.grossSales")}: ${formatInr(report.revenue.grossSales)}`}
        />
        <KpiCard
          label={t("dashboard.reports.profitLoss.kpi.grossProfit")}
          value={formatInr(report.grossProfit)}
          sub={`${report.grossMarginPercent.toFixed(1)}% ${t("dashboard.reports.profitLoss.margin")}`}
          tone={report.grossProfit >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          label="EBITDA"
          value={formatInr(report.ebitda)}
          sub={`${report.ebitdaMarginPercent.toFixed(1)}% ${t("dashboard.reports.profitLoss.margin")}`}
          tone={report.ebitda >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          label={t("dashboard.reports.profitLoss.kpi.pat")}
          value={formatInr(report.netProfit)}
          sub={`${report.netMarginPercent.toFixed(1)}% ${t("dashboard.reports.profitLoss.margin")}`}
          tone={report.netProfit >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("dashboard.reports.profitLoss.kpi.inventoryTurnover")} value={report.kpis.inventoryTurnover.toFixed(2)} />
        <KpiCard label={t("dashboard.reports.profitLoss.kpi.returnRate")} value={`${report.kpis.returnRatePercent.toFixed(1)}%`} />
        <KpiCard label={t("dashboard.reports.profitLoss.kpi.staffCostRatio")} value={`${report.kpis.staffCostPercentOfRevenue.toFixed(1)}%`} />
        <KpiCard
          label={t("dashboard.reports.profitLoss.kpi.salesPerSqFt")}
          value={report.kpis.salesPerSqFt != null ? formatInr(report.kpis.salesPerSqFt) : "—"}
          sub={report.kpis.salesPerSqFt == null ? t("dashboard.reports.profitLoss.kpi.salesPerSqFtHint") : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfitLossPieChart report={report} />
        <div className={`${tablePanelClass} p-5`}>
          <h3 className="text-sm font-bold text-brand-primary">{t("dashboard.reports.profitLoss.paymentBreakdown")}</h3>
          <p className="mt-0.5 text-xs text-brand-primary-muted">{t("dashboard.reports.profitLoss.paymentHint")}</p>
          <div className="mt-4 space-y-2">
            {(
              [
                ["cash", report.paymentModeBreakdown.cash],
                ["upi", report.paymentModeBreakdown.upi],
                ["card", report.paymentModeBreakdown.card],
                ["bank", report.paymentModeBreakdown.bank],
                ["cheque", report.paymentModeBreakdown.cheque],
              ] as const
            ).map(([mode, amount]) => (
              <div key={mode} className="flex justify-between text-sm">
                <span className="uppercase text-brand-primary-muted">{mode}</span>
                <span className="font-semibold tabular-nums">{formatInr(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
              <span>{t("dashboard.reports.profitLoss.total")}</span>
              <span className="tabular-nums">{formatInr(report.paymentModeBreakdown.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={tablePanelClass}>
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-brand-primary">{t("dashboard.reports.profitLoss.statementTitle")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.reports.profitLoss.colLine")}</th>
                <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.profitLoss.colAmount")}</th>
                {report.comparison ? (
                  <>
                    <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.profitLoss.colMom")}</th>
                    <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.profitLoss.colYoy")}</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {report.statement.map((row) => (
                <tr
                  key={row.line}
                  className={`${tableBodyRowClass} ${row.section === "pat" || row.section === "ebitda" || row.line === "Gross profit" || row.line === "Net revenue" ? "bg-brand-surface/30 font-semibold" : ""}`}
                >
                  <td className={tableBodyCellClass}>{row.line}</td>
                  <td className={`${tableBodyCellClass} text-right tabular-nums ${row.amount < 0 ? "text-red-600" : ""}`}>
                    {formatInr(row.amount)}
                  </td>
                  {report.comparison ? (
                    <>
                      <td className={`${tableBodyCellClass} text-right`}>—</td>
                      <td className={`${tableBodyCellClass} text-right`}>—</td>
                    </>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {report.comparison ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${tablePanelClass} p-4`}>
            <h3 className="text-sm font-bold text-brand-primary">{t("dashboard.reports.profitLoss.momTitle")}</h3>
            <p className="text-xs text-brand-primary-muted">
              {report.comparison.previousPeriod.fromDate} — {report.comparison.previousPeriod.toDate}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {(
                [
                  [t("dashboard.reports.profitLoss.kpi.netRevenue"), report.comparison.previousPeriod.netRevenue],
                  [t("dashboard.reports.profitLoss.kpi.grossProfit"), report.comparison.previousPeriod.grossProfit],
                  ["EBITDA", report.comparison.previousPeriod.ebitda],
                  [t("dashboard.reports.profitLoss.kpi.pat"), report.comparison.previousPeriod.netProfit],
                ] as const
              ).map(([label, delta]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-brand-primary-muted">{label}</span>
                  <DeltaBadge delta={delta} />
                </div>
              ))}
            </div>
          </div>
          <div className={`${tablePanelClass} p-4`}>
            <h3 className="text-sm font-bold text-brand-primary">{t("dashboard.reports.profitLoss.yoyTitle")}</h3>
            <p className="text-xs text-brand-primary-muted">
              {report.comparison.sameMonthLastYear.fromDate} — {report.comparison.sameMonthLastYear.toDate}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {(
                [
                  [t("dashboard.reports.profitLoss.kpi.netRevenue"), report.comparison.sameMonthLastYear.netRevenue],
                  [t("dashboard.reports.profitLoss.kpi.grossProfit"), report.comparison.sameMonthLastYear.grossProfit],
                  ["EBITDA", report.comparison.sameMonthLastYear.ebitda],
                  [t("dashboard.reports.profitLoss.kpi.pat"), report.comparison.sameMonthLastYear.netProfit],
                ] as const
              ).map(([label, delta]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-brand-primary-muted">{label}</span>
                  <DeltaBadge delta={delta} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {report.categoryWise.length > 0 ? (
        <div className={tablePanelClass}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-brand-primary">{t("dashboard.reports.profitLoss.categoryTitle")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className={`${tableClass} min-w-[640px]`}>
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.reports.profitLoss.colCategory")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.profitLoss.colNetRevenue")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>COGS</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.profitLoss.kpi.grossProfit")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.profitLoss.colContribution")}</th>
                </tr>
              </thead>
              <tbody>
                {report.categoryWise.map((row) => (
                  <tr key={row.categoryId} className={tableBodyRowClass}>
                    <td className={tableBodyCellClass}>{row.categoryName}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(row.netRevenue)}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(row.cogs)}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(row.grossProfit)}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{row.contributionPercent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
