import type { BalanceSheetReport } from "@/lib/reports/balance-sheet-types";
import type { ProfitLossReport } from "@/lib/reports/profit-loss-types";

export type ReportSlug =
  | "gstr1"
  | "gstr2"
  | "gstr3b"
  | "gst-sales-hsn"
  | "gst-purchase-hsn"
  | "hsn-wise-sales"
  | "sales-summary"
  | "purchase-summary"
  | "profit-and-loss"
  | "balance-sheet"
  | "cash-bank"
  | "daybook"
  | "party-outstanding"
  | "receivable-ageing"
  | "payable-ageing"
  | "stock-detail"
  | "low-stock"
  | "item-sales-purchase"
  | "expense-categories"
  | "bill-wise-profit"
  | "party-report-by-item"
  | "sales-category-wise";

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "currency" | "number" | "date" | "text";
};

export type ReportRow = Record<string, string | number | null | undefined>;

export type ReportMetric = {
  label: string;
  value: string | number;
  format?: "currency" | "number" | "text" | "date";
  tone?: "default" | "positive" | "negative" | "warning";
};

export type ReportChartBar = {
  label: string;
  value: number;
  color?: string;
};

export type ReportChart = {
  type: "bar" | "stacked";
  title: string;
  bars: ReportChartBar[];
  format?: "currency" | "number";
};

export type ReportTable = {
  id: string;
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  footer?: Record<string, string | number>;
};

export type ReportSection =
  | { type: "metrics"; title?: string; metrics: ReportMetric[] }
  | { type: "table"; table: ReportTable }
  | { type: "chart"; chart: ReportChart }
  | { type: "info"; title?: string; items: { label: string; value: string }[] }
  | {
      type: "comparison";
      title?: string;
      left: { label: string; items: ReportMetric[] };
      right: { label: string; items: ReportMetric[] };
    };

export type ReportPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReportData = {
  reportType: ReportSlug;
  title: string;
  fromDate?: string;
  toDate?: string;
  asOfDate?: string;
  financialYear?: string;
  sections: ReportSection[];
  pagination?: ReportPagination;
  profitLoss?: ProfitLossReport;
  balanceSheet?: BalanceSheetReport;
  /** Primary table for export / legacy */
  columns: ReportColumn[];
  rows: ReportRow[];
  summary?: Record<string, string | number>;
};

export type ReportFetchParams = {
  fromDate?: string;
  toDate?: string;
  partyId?: string;
  itemId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type PartyStatementParams = {
  partyId: string;
  fromDate?: string;
  toDate?: string;
};

export type ReportCategory = "favourite" | "gst" | "transaction" | "item" | "party" | "financial" | "inventory";

export type ReportLink = {
  slug: ReportSlug;
  category: ReportCategory;
  href: string;
};
