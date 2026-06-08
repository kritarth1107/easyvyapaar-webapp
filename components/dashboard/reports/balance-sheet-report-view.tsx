"use client";

import { useMemo, useRef } from "react";
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
import type { BalanceSheetLine, BalanceSheetReport } from "@/lib/reports/balance-sheet-types";
import { useTranslation } from "@/lib/localization";

type EnrichedLine = BalanceSheetLine & {
  priorAmount?: number;
  change?: number;
  changePercent?: number;
  highlight?: boolean;
};

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral" | "warn";
}) {
  const ring =
    tone === "positive"
      ? "border-emerald-200/80 bg-emerald-50/40"
      : tone === "negative"
        ? "border-red-200/80 bg-red-50/40"
        : tone === "warn"
          ? "border-amber-200/80 bg-amber-50/40"
          : "border-slate-200/90 bg-white";
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-brand-primary">{value}</p>
      {sub ? <p className="mt-1 text-xs text-brand-primary-muted">{sub}</p> : null}
    </div>
  );
}

function isTotalLine(line: EnrichedLine): boolean {
  return /total/i.test(line.label) || line.id.endsWith("_total");
}

function ChangeCell({ line }: { line: EnrichedLine }) {
  if (line.priorAmount == null || line.change == null || line.changePercent == null) {
    return <span className="text-brand-primary-muted">—</span>;
  }
  const up = line.change >= 0;
  return (
    <div className="text-right text-xs">
      <span className={`font-semibold tabular-nums ${up ? "text-emerald-700" : "text-red-600"}`}>
        {up ? "▲" : "▼"} {formatInr(Math.abs(line.change))}
      </span>
      <span className={`ml-1 tabular-nums ${line.highlight ? "font-bold text-amber-700" : "text-brand-primary-muted"}`}>
        ({line.changePercent.toFixed(1)}%)
      </span>
    </div>
  );
}

function StatementTable({
  title,
  lines,
  hasComparison,
  priorLabel,
}: {
  title: string;
  lines: EnrichedLine[];
  hasComparison: boolean;
  priorLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={`${tablePanelClass} flex flex-1 flex-col`}>
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-brand-primary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className={`${tableClass} min-w-[360px]`}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.reports.balanceSheet.colLine")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.balanceSheet.colAmount")}</th>
              {hasComparison ? (
                <>
                  <th className={`${tableHeadCellClass} text-right`}>{priorLabel}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.reports.balanceSheet.colChange")}</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr
                key={line.id}
                className={`${tableBodyRowClass} ${line.highlight ? "bg-amber-50/80" : ""} ${isTotalLine(line) ? "bg-brand-surface/30 font-semibold" : ""}`}
              >
                <td className={`${tableBodyCellClass} ${line.amount < 0 ? "pl-6 text-brand-primary-muted" : ""}`}>
                  {line.label}
                </td>
                <td
                  className={`${tableBodyCellClass} text-right tabular-nums ${line.amount < 0 ? "text-red-600" : ""}`}
                >
                  {formatInr(line.amount)}
                </td>
                {hasComparison ? (
                  <>
                    <td className={`${tableBodyCellClass} text-right tabular-nums text-brand-primary-muted`}>
                      {line.priorAmount != null ? formatInr(line.priorAmount) : "—"}
                    </td>
                    <td className={tableBodyCellClass}>
                      <ChangeCell line={line} />
                    </td>
                  </>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function exportBalanceSheetCsv(report: BalanceSheetReport, outletName?: string) {
  const lines = report.comparison?.lines ?? report.lines;
  const header = [
    ["Balance Sheet", outletName ?? "", report.month],
    ["As of", report.asOfDate, ""],
    ["Generated at", report.generatedAt, ""],
    [],
    ["Side", "Group", "Line item", "Amount", "Prior amount", "Change", "Change %"],
    ...lines.map((l) => [
      l.side,
      l.group,
      l.label,
      String(l.amount),
      String("priorAmount" in l ? (l.priorAmount ?? "") : ""),
      String("change" in l ? (l.change ?? "") : ""),
      String("changePercent" in l ? (l.changePercent ?? "") : ""),
    ]),
    [],
    ["KPI", "Value"],
    ["Current ratio", String(report.kpis.currentRatio)],
    ["Quick ratio", String(report.kpis.quickRatio)],
    ["Debt-to-equity", String(report.kpis.debtToEquity)],
    ["Inventory % of current assets", String(report.kpis.inventoryToCurrentAssetsPercent)],
    ["Working capital", String(report.kpis.workingCapital)],
    ["Return on assets %", String(report.kpis.returnOnAssetsPercent)],
    ["Return on equity %", String(report.kpis.returnOnEquityPercent)],
  ];
  const csv = header.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `balance-sheet-${report.asOfDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BalanceSheetReportView({
  report,
  outletName,
}: {
  report: BalanceSheetReport;
  outletName?: string;
}) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const enrichedLines: EnrichedLine[] = useMemo(
    () => report.comparison?.lines ?? report.lines,
    [report],
  );

  const assetLines = useMemo(
    () => enrichedLines.filter((l) => l.side === "assets"),
    [enrichedLines],
  );
  const liabilityLines = useMemo(
    () => enrichedLines.filter((l) => l.side === "liabilities_equity"),
    [enrichedLines],
  );

  const hasComparison = Boolean(report.comparison);
  const priorLabel = report.comparison
    ? formatDateIndian(report.comparison.priorAsOfDate)
    : t("dashboard.reports.balanceSheet.priorMonth");

  const currentRatioHealthy =
    report.kpis.currentRatio >= 1.5 && report.kpis.currentRatio <= 2.0;

  const handlePrintPdf = () => {
    const prevTitle = document.title;
    document.title = `Balance Sheet — ${outletName ?? "Outlet"} — ${report.month}`;
    window.print();
    window.setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  return (
    <div ref={printRef} className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 print:block">
        <div>
          {outletName ? (
            <p className="text-base font-bold text-brand-primary print:text-lg">{outletName}</p>
          ) : null}
          <p className="text-sm text-brand-primary-muted">
            {t("dashboard.reports.balanceSheet.asOf")} {formatDateIndian(report.asOfDate)} ·{" "}
            {t("dashboard.reports.balanceSheet.generated")}{" "}
            {formatDateIndian(report.generatedAt.slice(0, 10))}{" "}
            {report.generatedAt.slice(11, 16)}
          </p>
          <p className="mt-0.5 text-xs text-brand-primary-muted">
            {t("dashboard.reports.balanceSheet.plLinked")}: {formatInr(report.netProfitFromPl)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() => exportBalanceSheetCsv(report, outletName)}
            className="h-9 rounded-sm border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.reports.balanceSheet.exportExcel")}
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="h-9 rounded-sm border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.reports.balanceSheet.exportPdf")}
          </button>
        </div>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 ${
          report.balanceCheck.balanced
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-red-200 bg-red-50/60"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg">{report.balanceCheck.balanced ? "✓" : "⚠"}</span>
          <p className="text-sm font-semibold text-brand-primary">
            {report.balanceCheck.balanced
              ? t("dashboard.reports.balanceSheet.balanced")
              : t("dashboard.reports.balanceSheet.unbalanced")}
          </p>
          <span className="text-sm tabular-nums text-brand-primary-muted">
            {t("dashboard.reports.balanceSheet.assets")}: {formatInr(report.balanceCheck.totalAssets)} ·{" "}
            {t("dashboard.reports.balanceSheet.liabilitiesEquity")}:{" "}
            {formatInr(report.balanceCheck.totalLiabilitiesEquity)}
          </span>
          {!report.balanceCheck.balanced ? (
            <span className="text-sm font-bold text-red-600 tabular-nums">
              {t("dashboard.reports.balanceSheet.difference")}: {formatInr(report.balanceCheck.difference)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.currentRatio")}
          value={report.kpis.currentRatio.toFixed(2)}
          sub={
            currentRatioHealthy
              ? t("dashboard.reports.balanceSheet.kpi.currentRatioHealthy")
              : t("dashboard.reports.balanceSheet.kpi.currentRatioRange")
          }
          tone={currentRatioHealthy ? "positive" : "warn"}
        />
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.quickRatio")}
          value={report.kpis.quickRatio.toFixed(2)}
        />
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.debtToEquity")}
          value={report.kpis.debtToEquity.toFixed(2)}
        />
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.inventoryPct")}
          value={`${report.kpis.inventoryToCurrentAssetsPercent.toFixed(1)}%`}
          tone={report.kpis.inventoryToCurrentAssetsPercent > 50 ? "warn" : "neutral"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.workingCapital")}
          value={formatInr(report.kpis.workingCapital)}
          tone={report.kpis.workingCapital >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.roa")}
          value={`${report.kpis.returnOnAssetsPercent.toFixed(1)}%`}
        />
        <KpiCard
          label={t("dashboard.reports.balanceSheet.kpi.roe")}
          value={`${report.kpis.returnOnEquityPercent.toFixed(1)}%`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatementTable
          title={t("dashboard.reports.balanceSheet.assetsTitle")}
          lines={assetLines}
          hasComparison={hasComparison}
          priorLabel={priorLabel}
        />
        <StatementTable
          title={t("dashboard.reports.balanceSheet.liabilitiesTitle")}
          lines={liabilityLines}
          hasComparison={hasComparison}
          priorLabel={priorLabel}
        />
      </div>

      {hasComparison ? (
        <p className="text-xs text-brand-primary-muted">
          {t("dashboard.reports.balanceSheet.highlightNote")}
        </p>
      ) : null}
    </div>
  );
}
