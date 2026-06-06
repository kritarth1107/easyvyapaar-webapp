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

export type ReportData = {
  reportType: ReportSlug;
  title: string;
  fromDate?: string;
  toDate?: string;
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
