import { extractBackendError } from "@/lib/api/inventory";
import type { ReportColumn, ReportData, ReportRow, ReportSlug } from "@/lib/types/reports-api";

export { extractBackendError };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function unwrapData(body: unknown): unknown {
  const root = asRecord(body);
  if (root?.success === true && root.data !== undefined) return root.data;
  return body;
}

function inferFormat(key: string): ReportColumn["format"] {
  const lower = key.toLowerCase();
  if (lower.includes("date")) return "date";
  if (lower.includes("amount") || lower.includes("total") || lower.includes("balance") || lower.includes("profit") || lower.includes("tax")) {
    return "currency";
  }
  if (lower.includes("qty") || lower.includes("quantity") || lower.includes("count")) return "number";
  return "text";
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function normalizeReportColumn(raw: unknown): ReportColumn | null {
  const row = asRecord(raw);
  if (!row) return null;
  const key = pickString(row.key, row.field);
  const label = pickString(row.label, row.title);
  if (!key) return null;
  const align = pickString(row.align) as ReportColumn["align"] | undefined;
  const format = pickString(row.format) as ReportColumn["format"] | undefined;
  return {
    key,
    label: label ?? humanizeKey(key),
    align: align === "right" || align === "center" ? align : "left",
    format: format ?? inferFormat(key),
  };
}

function normalizeReportRow(raw: unknown): ReportRow | null {
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

function inferColumnsFromRows(rows: ReportRow[]): ReportColumn[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0] ?? {});
  return keys.map((key) => ({
    key,
    label: humanizeKey(key),
    align: inferFormat(key) === "currency" || inferFormat(key) === "number" ? "right" : "left",
    format: inferFormat(key),
  }));
}

export function normalizeReportData(body: unknown, reportType: ReportSlug): ReportData {
  const data = unwrapData(body);
  const row = asRecord(data);

  const rowsRaw = Array.isArray(data)
    ? data
    : Array.isArray(row?.rows)
      ? row.rows
      : Array.isArray(row?.items)
        ? row.items
        : Array.isArray(row?.data)
          ? row.data
          : [];

  const rows = rowsRaw
    .map((item) => normalizeReportRow(item))
    .filter((item): item is ReportRow => item !== null);

  const columnsRaw = Array.isArray(row?.columns) ? row.columns : [];
  const columns =
    columnsRaw.length > 0
      ? columnsRaw
          .map((col) => normalizeReportColumn(col))
          .filter((col): col is ReportColumn => col !== null)
      : inferColumnsFromRows(rows);

  const summary: Record<string, string | number> = {};
  const summaryRow = asRecord(row?.summary);
  if (summaryRow) {
    for (const [key, value] of Object.entries(summaryRow)) {
      if (typeof value === "string" || typeof value === "number") summary[key] = value;
    }
  }

  return {
    reportType,
    title: pickString(row?.title) ?? humanizeKey(reportType),
    fromDate: pickString(row?.fromDate),
    toDate: pickString(row?.toDate),
    columns,
    rows,
    ...(Object.keys(summary).length > 0 ? { summary } : {}),
  };
}
