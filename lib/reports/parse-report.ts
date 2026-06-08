import { isBalanceSheetReport, type BalanceSheetReport } from "@/lib/reports/balance-sheet-types";
import { isProfitLossReport, type ProfitLossReport } from "@/lib/reports/profit-loss-types";
import type {
  ReportChart,
  ReportColumn,
  ReportData,
  ReportMetric,
  ReportPagination,
  ReportRow,
  ReportSection,
  ReportSlug,
  ReportTable,
} from "@/lib/types/reports-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function unwrapData(body: unknown): unknown {
  const root = asRecord(body);
  if (root?.success === true && root.data !== undefined) return root.data;
  return body;
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function inferFormat(key: string): ReportColumn["format"] {
  const lower = key.toLowerCase();
  if (lower.includes("date")) return "date";
  if (
    lower.includes("amount") ||
    lower.includes("total") ||
    lower.includes("balance") ||
    lower.includes("profit") ||
    lower.includes("tax") ||
    lower.includes("receivable") ||
    lower.includes("payable") ||
    lower.includes("worth") ||
    lower.includes("value") ||
    lower.includes("cost") ||
    lower.includes("debit") ||
    lower.includes("credit") ||
    lower.includes("price") ||
    lower === "sales" ||
    lower === "purchases" ||
    lower === "expenses" ||
    lower === "taxable"
  ) {
    return "currency";
  }
  if (
    lower.includes("qty") ||
    lower.includes("quantity") ||
    lower.includes("count") ||
    lower.includes("days") ||
    lower.includes("percent") ||
    lower.includes("shortfall")
  ) {
    return "number";
  }
  return "text";
}

function toRow(raw: unknown): ReportRow | null {
  const row = asRecord(raw);
  if (!row) return null;
  const normalized: ReportRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string" || typeof value === "number" || value === null || value === undefined) {
      normalized[key] = value as string | number | null | undefined;
    } else if (typeof value === "boolean") {
      normalized[key] = value ? "Yes" : "No";
    } else {
      normalized[key] = String(value);
    }
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

function toRows(items: unknown[]): ReportRow[] {
  return items.map(toRow).filter((r): r is ReportRow => r !== null);
}

function inferColumns(rows: ReportRow[], overrides?: Partial<Record<string, string>>): ReportColumn[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0] ?? {});
  return keys.map((key) => ({
    key,
    label: overrides?.[key] ?? humanizeKey(key),
    align: inferFormat(key) === "currency" || inferFormat(key) === "number" ? "right" : "left",
    format: inferFormat(key),
  }));
}

function col(key: string, label: string, format?: ReportColumn["format"]): ReportColumn {
  return {
    key,
    label,
    align: format === "currency" || format === "number" ? "right" : "left",
    format: format ?? inferFormat(key),
  };
}

function metric(label: string, value: number | string | undefined, format?: ReportMetric["format"], tone?: ReportMetric["tone"]): ReportMetric {
  return {
    label,
    value: value ?? 0,
    format: format ?? (typeof value === "number" ? inferFormat(label) : "text"),
    tone,
  };
}

function makeTable(id: string, title: string, columns: ReportColumn[], rows: ReportRow[], footer?: Record<string, string | number>): ReportTable {
  return { id, title, columns, rows, footer };
}

function sumField(rows: ReportRow[], key: string): number {
  return rows.reduce((acc, row) => acc + (pickNumber(row[key]) ?? 0), 0);
}

function normalizePagination(raw: unknown): ReportPagination | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  const page = pickNumber(row.page);
  const limit = pickNumber(row.limit);
  const total = pickNumber(row.total);
  const totalPages = pickNumber(row.totalPages);
  if (page === undefined || limit === undefined || total === undefined || totalPages === undefined) return undefined;
  return { page, limit, total, totalPages };
}

function periodInfo(row: Record<string, unknown>): ReportSection | null {
  const items: { label: string; value: string }[] = [];
  const from = pickString(row.fromDate);
  const to = pickString(row.toDate);
  const asOf = pickString(row.asOfDate);
  const fy = pickString(row.financialYear);
  if (from && to) {
    items.push({ label: "Period", value: `${from} to ${to}` });
  } else if (asOf) {
    items.push({ label: "As of", value: asOf });
  }
  if (fy) items.push({ label: "Financial year", value: fy });
  if (row.type && typeof row.type === "string") {
    items.push({ label: "Type", value: row.type });
  }
  return items.length > 0 ? { type: "info", title: "Report period", items } : null;
}

function barChart(title: string, bars: { label: string; value: number }[], format: ReportChart["format"] = "currency"): ReportSection {
  const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#ca8a04"];
  return {
    type: "chart",
    chart: {
      type: "bar",
      title,
      format,
      bars: bars.map((b, i) => ({ ...b, color: colors[i % colors.length] })),
    },
  };
}

function finalize(
  reportType: ReportSlug,
  row: Record<string, unknown>,
  sections: ReportSection[],
  primaryTable?: ReportTable,
): ReportData {
  const filtered = sections.filter(Boolean) as ReportSection[];
  const primary = primaryTable ?? filtered.find((s) => s.type === "table")?.table;
  return {
    reportType,
    title: humanizeKey(reportType),
    fromDate: pickString(row.fromDate),
    toDate: pickString(row.toDate, row.asOfDate),
    asOfDate: pickString(row.asOfDate),
    financialYear: pickString(row.financialYear),
    sections: filtered,
    pagination: normalizePagination(row.pagination),
    columns: primary?.columns ?? [],
    rows: primary?.rows ?? [],
    summary: primary?.footer,
  };
}

function parseGstr1(row: Record<string, unknown>): ReportData {
  const b2b = toRows(Array.isArray(row.b2b) ? row.b2b : []);
  const b2c = toRows(Array.isArray(row.b2c) ? row.b2c : []);
  const gstCols = [
    col("gstPercent", "GST %", "number"),
    col("taxableAmount", "Taxable", "currency"),
    col("taxAmount", "Tax", "currency"),
    col("totalAmount", "Total", "currency"),
    col("invoiceCount", "Invoices", "number"),
  ];
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "GSTR-1 totals",
    metrics: [
      metric("Total taxable", pickNumber(row.totalTaxable), "currency"),
      metric("Total tax", pickNumber(row.totalTax), "currency"),
      metric("Total amount", pickNumber(row.totalAmount), "currency"),
      metric("B2B rows", b2b.length, "number"),
      metric("B2C rows", b2c.length, "number"),
    ],
  });
  if (b2b.length > 0) {
    sections.push({ type: "table", table: makeTable("b2b", "B2B — Registered customers (GSTIN)", gstCols, b2b) });
  }
  if (b2c.length > 0) {
    sections.push({ type: "table", table: makeTable("b2c", "B2C — Unregistered / retail sales", gstCols, b2c) });
  }
  const rateBars = [...b2b, ...b2c].map((r) => ({
    label: `${r.gstPercent ?? 0}%`,
    value: pickNumber(r.taxAmount) ?? 0,
  }));
  if (rateBars.length > 0) sections.push(barChart("Tax by GST rate", rateBars));
  const allRows = [...b2b.map((r) => ({ ...r, segment: "B2B" })), ...b2c.map((r) => ({ ...r, segment: "B2C" }))];
  const primary = allRows.length > 0
    ? makeTable("combined", "All GST rate breakup", [col("segment", "Segment"), ...gstCols], allRows, {
        totalAmount: pickNumber(row.totalAmount) ?? 0,
      })
    : undefined;
  return finalize("gstr1", row, sections, primary);
}

function parseGstr2(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [
    col("gstPercent", "GST %", "number"),
    col("taxableAmount", "Taxable", "currency"),
    col("taxAmount", "Tax", "currency"),
    col("totalAmount", "Total", "currency"),
    col("invoiceCount", "Bills", "number"),
  ];
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "GSTR-2 purchase totals",
    metrics: [
      metric("Total taxable", pickNumber(row.totalTaxable), "currency"),
      metric("Total tax (ITC)", pickNumber(row.totalTax), "currency"),
      metric("Total amount", pickNumber(row.totalAmount), "currency"),
      metric("GST rate rows", items.length, "number"),
    ],
  });
  if (items.length > 0) {
    sections.push({ type: "table", table: makeTable("items", "Purchase by GST rate", cols, items) });
    sections.push(barChart("Input tax by rate", items.map((r) => ({ label: `${r.gstPercent ?? 0}%`, value: pickNumber(r.taxAmount) ?? 0 }))));
  }
  return finalize("gstr2", row, sections, items.length > 0 ? makeTable("items", "Purchase by GST rate", cols, items) : undefined);
}

function parseGstr3b(row: Record<string, unknown>): ReportData {
  const outputTax = pickNumber(row.outputTax) ?? 0;
  const inputTax = pickNumber(row.inputTax) ?? 0;
  const netPayable = pickNumber(row.netPayable) ?? 0;
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "GSTR-3B summary",
    metrics: [
      metric("Output tax", outputTax, "currency"),
      metric("Input tax (ITC)", inputTax, "currency"),
      metric("Net payable", netPayable, "currency", netPayable > 0 ? "negative" : "positive"),
      metric("Sales taxable", pickNumber(row.salesTaxable), "currency"),
      metric("Purchase taxable", pickNumber(row.purchaseTaxable), "currency"),
      metric("Expense tax", pickNumber(row.expenseTax), "currency"),
    ],
  });
  sections.push({
    type: "comparison",
    title: "Tax liability vs credit",
    left: { label: "Output (payable)", items: [metric("Output tax", outputTax, "currency")] },
    right: { label: "Input (credit)", items: [metric("Input tax", inputTax, "currency")] },
  });
  sections.push(barChart("Output vs Input tax", [
    { label: "Output tax", value: outputTax },
    { label: "Input tax", value: inputTax },
    { label: "Net payable", value: netPayable },
  ]));
  const breakdownRows: ReportRow[] = [
    { item: "Sales taxable value", amount: pickNumber(row.salesTaxable) ?? 0 },
    { item: "Purchase taxable value", amount: pickNumber(row.purchaseTaxable) ?? 0 },
    { item: "Expense tax", amount: pickNumber(row.expenseTax) ?? 0 },
    { item: "Output tax", amount: outputTax },
    { item: "Input tax", amount: inputTax },
    { item: "Net payable", amount: netPayable },
  ];
  const table = makeTable("breakdown", "Full breakup", [col("item", "Item"), col("amount", "Amount", "currency")], breakdownRows);
  sections.push({ type: "table", table });
  return finalize("gstr3b", row, sections, table);
}

function parseHsnLineReport(
  reportType: "gst-sales-hsn" | "gst-purchase-hsn",
  row: Record<string, unknown>,
  docLabel: string,
  docKey: string,
  dateKey: string,
): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [
    col(docKey, docLabel),
    col(dateKey, "Date", "date"),
    col("partyName", "Party"),
    col("hsn", "HSN"),
    col("itemName", "Item"),
    col("qty", "Qty", "number"),
    col("taxable", "Taxable", "currency"),
    col("tax", "Tax", "currency"),
    col("gstPercent", "GST %", "number"),
    col("total", "Total", "currency"),
  ];
  const totalTaxable = sumField(items, "taxable");
  const totalTax = sumField(items, "tax");
  const totalAmount = sumField(items, "total");
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Line item summary",
    metrics: [
      metric("Line items", pickNumber(row.count) ?? items.length, "number"),
      metric("Total taxable", totalTaxable, "currency"),
      metric("Total tax", totalTax, "currency"),
      metric("Grand total", totalAmount, "currency"),
    ],
  });
  if (items.length > 0) {
    const hsnMap = new Map<string, number>();
    for (const item of items) {
      const hsn = String(item.hsn ?? "—");
      hsnMap.set(hsn, (hsnMap.get(hsn) ?? 0) + (pickNumber(item.total) ?? 0));
    }
    const topHsn = [...hsnMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (topHsn.length > 0) {
      sections.push(barChart("Top HSN by amount", topHsn.map(([label, value]) => ({ label, value }))));
    }
    sections.push({
      type: "table",
      table: makeTable("lines", "Every line item", cols, items, {
        total: totalAmount,
        count: pickNumber(row.count) ?? items.length,
      }),
    });
  }
  return finalize(reportType, row, sections, items.length > 0 ? makeTable("lines", "Line items", cols, items) : undefined);
}

function parseHsnWiseSales(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("hsn", "HSN"), col("qty", "Qty", "number"), col("taxable", "Taxable", "currency"), col("tax", "Tax", "currency"), col("total", "Total", "currency")];
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  const totalAmount = sumField(items, "total");
  sections.push({
    type: "metrics",
    title: "HSN summary",
    metrics: [
      metric("HSN codes", items.length, "number"),
      metric("Total qty", sumField(items, "qty"), "number"),
      metric("Total taxable", sumField(items, "taxable"), "currency"),
      metric("Total tax", sumField(items, "tax"), "currency"),
      metric("Grand total", totalAmount, "currency"),
    ],
  });
  if (items.length > 0) {
    sections.push({ type: "table", table: makeTable("hsn", "HSN-wise rollup", cols, items, { total: totalAmount }) });
    sections.push(barChart("Sales by HSN", items.slice(0, 10).map((r) => ({ label: String(r.hsn ?? "—"), value: pickNumber(r.total) ?? 0 }))));
  }
  return finalize("hsn-wise-sales", row, sections, items.length > 0 ? makeTable("hsn", "HSN-wise", cols, items) : undefined);
}

function parseSalesSummary(row: Record<string, unknown>): ReportData {
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  const subtotal = pickNumber(row.subtotal) ?? 0;
  const tax = pickNumber(row.tax) ?? 0;
  const total = pickNumber(row.totalAmount) ?? 0;
  const received = pickNumber(row.amountReceived) ?? 0;
  const balance = pickNumber(row.balanceAmount) ?? 0;
  sections.push({
    type: "metrics",
    title: "Sales performance",
    metrics: [
      metric("Invoices", pickNumber(row.count), "number"),
      metric("Subtotal", subtotal, "currency"),
      metric("Tax", tax, "currency"),
      metric("Total sales", total, "currency"),
      metric("Amount received", received, "currency", "positive"),
      metric("Balance due", balance, "currency", balance > 0 ? "warning" : "default"),
    ],
  });
  sections.push(barChart("Sales breakup", [
    { label: "Subtotal", value: subtotal },
    { label: "Tax", value: tax },
    { label: "Received", value: received },
    { label: "Balance due", value: balance },
  ]));
  const table = makeTable("summary", "Period totals", [col("metric", "Metric"), col("value", "Value", "currency")], [
    { metric: "Invoice count", value: pickNumber(row.count) ?? 0 },
    { metric: "Subtotal", value: subtotal },
    { metric: "Tax", value: tax },
    { metric: "Total amount", value: total },
    { metric: "Amount received", value: received },
    { metric: "Balance due", value: balance },
  ]);
  sections.push({ type: "table", table });
  return finalize("sales-summary", row, sections, table);
}

function parsePurchaseSummary(row: Record<string, unknown>): ReportData {
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  const subtotal = pickNumber(row.subtotal) ?? 0;
  const tax = pickNumber(row.tax) ?? 0;
  const total = pickNumber(row.totalAmount) ?? 0;
  const paid = pickNumber(row.amountPaid) ?? 0;
  const balance = pickNumber(row.balanceAmount) ?? 0;
  sections.push({
    type: "metrics",
    title: "Purchase summary",
    metrics: [
      metric("Bills", pickNumber(row.count), "number"),
      metric("Subtotal", subtotal, "currency"),
      metric("Tax", tax, "currency"),
      metric("Total purchase", total, "currency"),
      metric("Amount paid", paid, "currency", "positive"),
      metric("Balance due", balance, "currency", balance > 0 ? "warning" : "default"),
    ],
  });
  sections.push(barChart("Purchase breakup", [
    { label: "Subtotal", value: subtotal },
    { label: "Tax", value: tax },
    { label: "Paid", value: paid },
    { label: "Balance due", value: balance },
  ]));
  const table = makeTable("summary", "Period totals", [col("metric", "Metric"), col("value", "Value", "currency")], [
    { metric: "Bill count", value: pickNumber(row.count) ?? 0 },
    { metric: "Subtotal", value: subtotal },
    { metric: "Tax", value: tax },
    { metric: "Total amount", value: total },
    { metric: "Amount paid", value: paid },
    { metric: "Balance due", value: balance },
  ]);
  sections.push({ type: "table", table });
  return finalize("purchase-summary", row, sections, table);
}

function parseProfitAndLoss(row: Record<string, unknown>): ReportData {
  if (isProfitLossReport(row)) {
    const pl = row as ProfitLossReport;
    return {
      reportType: "profit-and-loss",
      title: "Profit & Loss",
      fromDate: pl.fromDate,
      toDate: pl.toDate,
      profitLoss: pl,
      sections: [],
      columns: [],
      rows: [],
    };
  }
  return {
    reportType: "profit-and-loss",
    title: "Profit & Loss",
    sections: [],
    columns: [],
    rows: [],
  };
}

function parseBalanceSheet(row: Record<string, unknown>): ReportData {
  if (isBalanceSheetReport(row)) {
    const bs = row as BalanceSheetReport;
    return {
      reportType: "balance-sheet",
      title: "Balance Sheet",
      toDate: bs.asOfDate,
      asOfDate: bs.asOfDate,
      balanceSheet: bs,
      sections: [],
      columns: [],
      rows: [],
    };
  }
  return {
    reportType: "balance-sheet",
    title: "Balance Sheet",
    sections: [],
    columns: [],
    rows: [],
  };
}

function parseCashBank(row: Record<string, unknown>): ReportData {
  const modeRows = toRows(Array.isArray(row.modeSummary) ? row.modeSummary : []);
  const bankRows = toRows(Array.isArray(row.bankAccounts) ? row.bankAccounts : []);
  const cashInHand = pickNumber(row.cashInHand) ?? 0;
  const totalBank = pickNumber(row.totalBankBalance) ?? 0;
  const sections: ReportSection[] = [];
  sections.push({
    type: "metrics",
    title: "Cash & bank position",
    metrics: [
      metric("Cash in hand", cashInHand, "currency"),
      metric("Total bank balance", totalBank, "currency"),
      metric("Combined liquidity", cashInHand + totalBank, "currency", "positive"),
    ],
  });
  if (modeRows.length > 0) {
    const modeCols = [col("mode", "Mode"), col("totalIn", "Total in", "currency"), col("totalOut", "Total out", "currency"), col("netBalance", "Net", "currency")];
    sections.push({ type: "table", table: makeTable("modes", "Payment mode summary", modeCols, modeRows) });
    sections.push(barChart("Net by payment mode", modeRows.map((r) => ({ label: String(r.mode ?? "—"), value: pickNumber(r.netBalance) ?? 0 }))));
  }
  if (bankRows.length > 0) {
    const bankCols = [col("bankName", "Bank"), col("accountNumber", "Account"), col("accountHolderName", "Holder"), col("isPrimary", "Primary"), col("balance", "Balance", "currency")];
    sections.push({ type: "table", table: makeTable("banks", "Bank accounts", bankCols, bankRows, { totalBankBalance: totalBank }) });
  }
  const allRows = [...modeRows.map((r) => ({ ...r, _type: "Mode" })), ...bankRows.map((r) => ({ ...r, _type: "Bank" }))];
  const primary = allRows.length > 0 ? makeTable("all", "Cash & bank", inferColumns(allRows), allRows) : undefined;
  return finalize("cash-bank", row, sections, primary);
}

function parseDaybook(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [
    col("entryDate", "Date", "date"),
    col("entryType", "Type"),
    col("referenceNumber", "Ref #"),
    col("partyName", "Party"),
    col("description", "Description"),
    col("paymentMode", "Mode"),
    col("debit", "Debit", "currency"),
    col("credit", "Credit", "currency"),
  ];
  const totalDebit = sumField(items, "debit");
  const totalCredit = sumField(items, "credit");
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Daybook totals",
    metrics: [
      metric("Entries", items.length, "number"),
      metric("Total debit", totalDebit, "currency"),
      metric("Total credit", totalCredit, "currency"),
      metric("Net movement", totalCredit - totalDebit, "currency"),
    ],
  });
  const table = makeTable("entries", "All ledger entries", cols, items, { debit: totalDebit, credit: totalCredit });
  sections.push({ type: "table", table });
  return finalize("daybook", row, sections, table);
}

function parsePartyOutstanding(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("name", "Party"), col("partyType", "Type"), col("phone", "Phone"), col("balanceType", "Balance type"), col("outstandingAmount", "Outstanding", "currency"), col("balance", "Balance", "currency")];
  let receivable = 0;
  let payable = 0;
  for (const item of items) {
    const amt = pickNumber(item.outstandingAmount) ?? pickNumber(item.balance) ?? 0;
    if (item.balanceType === "payable") payable += amt;
    else receivable += amt;
  }
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Outstanding summary",
    metrics: [
      metric("Parties", items.length, "number"),
      metric("Total receivable", receivable, "currency", "positive"),
      metric("Total payable", payable, "currency", "warning"),
      metric("Net position", receivable - payable, "currency"),
    ],
  });
  if (items.length > 0) {
    sections.push(barChart("Top outstanding parties", items.slice(0, 8).map((r) => ({ label: String(r.name ?? "—").slice(0, 12), value: pickNumber(r.outstandingAmount) ?? 0 }))));
  }
  const table = makeTable("parties", "Party-wise outstanding", cols, items, { receivable, payable });
  sections.push({ type: "table", table });
  return finalize("party-outstanding", row, sections, table);
}

function parseAgeing(reportType: "receivable-ageing" | "payable-ageing", row: Record<string, unknown>): ReportData {
  const buckets = asRecord(row.buckets);
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const total = pickNumber(row.total) ?? 0;
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  if (buckets) {
    sections.push({
      type: "metrics",
      title: "Ageing buckets",
      metrics: [
        metric("Current", pickNumber(buckets.current), "currency"),
        metric("1–30 days", pickNumber(buckets.days1to30), "currency"),
        metric("31–60 days", pickNumber(buckets.days31to60), "currency"),
        metric("61–90 days", pickNumber(buckets.days61to90), "currency"),
        metric("Over 90 days", pickNumber(buckets.over90), "currency"),
        metric("Total", total, "currency"),
      ],
    });
    sections.push(barChart("Ageing distribution", [
      { label: "Current", value: pickNumber(buckets.current) ?? 0 },
      { label: "1–30", value: pickNumber(buckets.days1to30) ?? 0 },
      { label: "31–60", value: pickNumber(buckets.days31to60) ?? 0 },
      { label: "61–90", value: pickNumber(buckets.days61to90) ?? 0 },
      { label: "90+", value: pickNumber(buckets.over90) ?? 0 },
    ]));
  }
  const itemCols = [col("name", "Party"), col("amount", "Amount", "currency"), col("daysOutstanding", "Days", "number"), col("lastTransactionDate", "Last txn", "date")];
  const table = makeTable("parties", "Party-wise ageing detail", itemCols, items, { total });
  if (items.length > 0) sections.push({ type: "table", table });
  return finalize(reportType, row, sections, items.length > 0 ? table : undefined);
}

function parseStockDetail(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [
    col("name", "Item"),
    col("categoryName", "Category"),
    col("hsn", "HSN"),
    col("unit", "Unit"),
    col("currentStock", "Stock", "number"),
    col("purchasePrice", "Purchase price", "currency"),
    col("salesPrice", "Sale price", "currency"),
    col("stockValue", "Stock value", "currency"),
    col("lowStockQty", "Reorder level", "number"),
    col("isLowStock", "Low stock"),
  ];
  const stockValue = sumField(items, "stockValue");
  const lowCount = items.filter((i) => i.isLowStock === "Yes" || i.isLowStock === "true").length;
  const sections: ReportSection[] = [];
  sections.push({
    type: "metrics",
    title: "Inventory snapshot",
    metrics: [
      metric("Items", items.length, "number"),
      metric("Total stock value", stockValue, "currency"),
      metric("Low stock items", lowCount, "number", lowCount > 0 ? "warning" : "default"),
    ],
  });
  const table = makeTable("stock", "Item-wise stock detail", cols, items, { stockValue });
  sections.push({ type: "table", table });
  if (items.length > 0) {
    sections.push(barChart("Top items by stock value", [...items].sort((a, b) => (pickNumber(b.stockValue) ?? 0) - (pickNumber(a.stockValue) ?? 0)).slice(0, 8).map((r) => ({ label: String(r.name ?? "—").slice(0, 14), value: pickNumber(r.stockValue) ?? 0 }))));
  }
  return finalize("stock-detail", row, sections, table);
}

function parseLowStock(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("name", "Item"), col("categoryName", "Category"), col("currentStock", "Stock", "number"), col("lowStockQty", "Reorder at", "number"), col("shortfall", "Shortfall", "number"), col("unit", "Unit")];
  const sections: ReportSection[] = [];
  sections.push({
    type: "metrics",
    title: "Low stock alert",
    metrics: [metric("Items below reorder", pickNumber(row.count) ?? items.length, "number", "warning")],
  });
  const table = makeTable("low", "Items to restock", cols, items, { count: pickNumber(row.count) ?? items.length });
  sections.push({ type: "table", table });
  if (items.length > 0) {
    sections.push(barChart("Shortfall by item", items.map((r) => ({ label: String(r.name ?? "—").slice(0, 14), value: pickNumber(r.shortfall) ?? 0 })), "number"));
  }
  return finalize("low-stock", row, sections, table);
}

function parseItemSalesPurchase(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("name", "Item"), col("salesQty", "Sales qty", "number"), col("salesAmount", "Sales amount", "currency"), col("purchaseQty", "Purchase qty", "number"), col("purchaseAmount", "Purchase amount", "currency")];
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Item movement",
    metrics: [
      metric("Items", items.length, "number"),
      metric("Sales amount", sumField(items, "salesAmount"), "currency"),
      metric("Purchase amount", sumField(items, "purchaseAmount"), "currency"),
    ],
  });
  const table = makeTable("items", "Item-wise sales & purchase", cols, items);
  sections.push({ type: "table", table });
  return finalize("item-sales-purchase", row, sections, table);
}

function parseExpenseCategories(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("category", "Category"), col("count", "Entries", "number"), col("amount", "Amount", "currency"), col("tax", "Tax", "currency")];
  const total = pickNumber(row.totalAmount) ?? sumField(items, "amount") + sumField(items, "tax");
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Expense overview",
    metrics: [metric("Categories", items.length, "number"), metric("Total expense", total, "currency")],
  });
  if (items.length > 0) {
    sections.push(barChart("Expense by category", items.map((r) => ({ label: String(r.category ?? "—").slice(0, 14), value: (pickNumber(r.amount) ?? 0) + (pickNumber(r.tax) ?? 0) }))));
  }
  const table = makeTable("expenses", "Category-wise expenses", cols, items, { totalAmount: total });
  sections.push({ type: "table", table });
  return finalize("expense-categories", row, sections, table);
}

function parseBillWiseProfit(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [
    col("invoiceNumber", "Invoice"),
    col("invoiceDate", "Date", "date"),
    col("partyName", "Party"),
    col("itemName", "Item"),
    col("qty", "Qty", "number"),
    col("salesAmount", "Sales", "currency"),
    col("purchaseCost", "Cost", "currency"),
    col("profit", "Profit", "currency"),
  ];
  const totalProfit = pickNumber(row.totalProfit) ?? sumField(items, "profit");
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Margin summary",
    metrics: [
      metric("Line items", items.length, "number"),
      metric("Total profit", totalProfit, "currency", totalProfit >= 0 ? "positive" : "negative"),
      metric("Total sales", sumField(items, "salesAmount"), "currency"),
      metric("Total cost", sumField(items, "purchaseCost"), "currency"),
    ],
  });
  const table = makeTable("bills", "Bill-wise profit (line level)", cols, items, { totalProfit });
  sections.push({ type: "table", table });
  return finalize("bill-wise-profit", row, sections, table);
}

function parsePartyByItem(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("partyName", "Party"), col("itemName", "Item"), col("qty", "Qty", "number"), col("amount", "Amount", "currency")];
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Party × item sales",
    metrics: [
      metric("Rows", items.length, "number"),
      metric("Total qty", sumField(items, "qty"), "number"),
      metric("Total amount", sumField(items, "amount"), "currency"),
    ],
  });
  const table = makeTable("party-item", "Party sales by item", cols, items);
  sections.push({ type: "table", table });
  return finalize("party-report-by-item", row, sections, table);
}

function parseSalesByCategory(row: Record<string, unknown>): ReportData {
  const items = toRows(Array.isArray(row.items) ? row.items : []);
  const cols = [col("categoryName", "Category"), col("qty", "Qty", "number"), col("amount", "Taxable", "currency"), col("tax", "Tax", "currency")];
  const total = pickNumber(row.totalAmount) ?? items.reduce((acc, r) => acc + (pickNumber(r.amount) ?? 0) + (pickNumber(r.tax) ?? 0), 0);
  const sections: ReportSection[] = [];
  const info = periodInfo(row);
  if (info) sections.push(info);
  sections.push({
    type: "metrics",
    title: "Category sales",
    metrics: [metric("Categories", items.length, "number"), metric("Total sales", total, "currency")],
  });
  if (items.length > 0) {
    sections.push(barChart("Sales by category", items.map((r) => ({ label: String(r.categoryName ?? "—").slice(0, 14), value: (pickNumber(r.amount) ?? 0) + (pickNumber(r.tax) ?? 0) }))));
  }
  const table = makeTable("categories", "Category-wise sales", cols, items, { totalAmount: total });
  sections.push({ type: "table", table });
  return finalize("sales-category-wise", row, sections, table);
}

const PARSERS: Record<ReportSlug, (row: Record<string, unknown>) => ReportData> = {
  gstr1: parseGstr1,
  gstr2: parseGstr2,
  gstr3b: parseGstr3b,
  "gst-sales-hsn": (row) => parseHsnLineReport("gst-sales-hsn", row, "Invoice #", "invoiceNumber", "invoiceDate"),
  "gst-purchase-hsn": (row) => parseHsnLineReport("gst-purchase-hsn", row, "Bill #", "billNumber", "billDate"),
  "hsn-wise-sales": parseHsnWiseSales,
  "sales-summary": parseSalesSummary,
  "purchase-summary": parsePurchaseSummary,
  "profit-and-loss": parseProfitAndLoss,
  "balance-sheet": parseBalanceSheet,
  "cash-bank": parseCashBank,
  daybook: parseDaybook,
  "party-outstanding": parsePartyOutstanding,
  "receivable-ageing": (row) => parseAgeing("receivable-ageing", row),
  "payable-ageing": (row) => parseAgeing("payable-ageing", row),
  "stock-detail": parseStockDetail,
  "low-stock": parseLowStock,
  "item-sales-purchase": parseItemSalesPurchase,
  "expense-categories": parseExpenseCategories,
  "bill-wise-profit": parseBillWiseProfit,
  "party-report-by-item": parsePartyByItem,
  "sales-category-wise": parseSalesByCategory,
};

export function isParsedReport(data: unknown): data is ReportData {
  const row = asRecord(data);
  return !!row && Array.isArray(row.sections) && typeof row.reportType === "string";
}

export function parseReportData(body: unknown, reportType: ReportSlug): ReportData {
  const data = unwrapData(body);
  const row = asRecord(data);
  if (!row) {
    return { reportType, title: humanizeKey(reportType), sections: [], columns: [], rows: [] };
  }
  if (isParsedReport(row)) return row;
  const parser = PARSERS[reportType];
  return parser(row);
}

/** @deprecated Use parseReportData — kept for API route import */
export function normalizeReportData(body: unknown, reportType: ReportSlug): ReportData {
  return parseReportData(body, reportType);
}
