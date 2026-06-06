import { extractBackendError } from "@/lib/api/inventory";
import { inferSalesTaxMode, normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import { normalizeDiscountTiming } from "@/lib/sales/invoice-totals";
import type {
  NextQuotationNumber,
  QuotationDetail,
  QuotationListResponse,
  QuotationSummary,
} from "@/lib/types/quotations-api";

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

function normalizePagination(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const page = pickNumber(row.page);
  const limit = pickNumber(row.limit);
  const total = pickNumber(row.total);
  const totalPages = pickNumber(row.totalPages);
  if (page === undefined || limit === undefined || total === undefined || totalPages === undefined) {
    return null;
  }
  return { page, limit, total, totalPages };
}

export function normalizeNextQuotationNumber(raw: unknown): NextQuotationNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const quotationPrefix = pickString(row.quotationPrefix);
  const quotationNumber = pickString(row.quotationNumber);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!quotationPrefix || !quotationNumber || !suggestedDisplay) return null;
  return { quotationPrefix, quotationNumber, suggestedDisplay };
}

export function normalizeQuotationSummary(raw: unknown): QuotationSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const quotationId = pickString(row.quotationId);
  const displayNumber = pickString(row.displayNumber);
  const partyName = pickString(row.partyName);
  const quotationDate = pickString(row.quotationDate);
  const status = pickString(row.status) as QuotationSummary["status"] | undefined;
  const totalAmount = pickNumber(row.totalAmount);

  if (!quotationId || !displayNumber || !partyName || !quotationDate || !status || totalAmount === undefined) {
    return null;
  }

  return {
    quotationId,
    displayNumber,
    partyName,
    quotationDate,
    totalAmount,
    status,
    ...(pickString(row.partyId) && { partyId: pickString(row.partyId) }),
    ...(pickString(row.validUntil) && { validUntil: pickString(row.validUntil) }),
  };
}

function normalizeQuotationLineItem(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const lineId = pickString(row.lineId);
  const itemId = pickString(row.itemId);
  const name = pickString(row.name);
  const unit = pickString(row.unit) ?? "";
  const hsn = pickString(row.hsn) ?? "";
  const qty = pickNumber(row.qty);
  const pricePerItem = pickNumber(row.pricePerItem);
  const discount = pickNumber(row.discount);
  const discountType = pickString(row.discountType);
  const gstPercent = pickNumber(row.gstPercent);
  const taxable = pickNumber(row.taxable);
  const tax = pickNumber(row.tax);
  const amount = pickNumber(row.amount);

  if (
    !lineId ||
    !itemId ||
    !name ||
    qty === undefined ||
    pricePerItem === undefined ||
    discount === undefined ||
    (discountType !== "percent" && discountType !== "amount") ||
    gstPercent === undefined ||
    taxable === undefined ||
    tax === undefined ||
    amount === undefined
  ) {
    return null;
  }

  return {
    lineId,
    itemId,
    name,
    hsn,
    qty,
    unit,
    pricePerItem,
    discount,
    discountType: discountType as "percent" | "amount",
    gstPercent,
    salesTaxMode: normalizeSalesTaxMode(
      inferSalesTaxMode({
        qty,
        pricePerItem,
        gstPercent,
        amount,
        ...(typeof row.salesTaxMode === "string"
          ? { salesTaxMode: normalizeSalesTaxMode(row.salesTaxMode) }
          : {}),
      }),
    ),
    taxable,
    tax,
    amount,
    ...(Array.isArray(row.serialNumbers)
      ? {
          serialNumbers: row.serialNumbers
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean),
        }
      : {}),
    ...(pickString(row.supplierId) ? { supplierId: pickString(row.supplierId) } : {}),
    ...(pickString(row.supplierName) ? { supplierName: pickString(row.supplierName) } : {}),
  };
}

export function normalizeQuotationDetail(raw: unknown): QuotationDetail | null {
  const summary = normalizeQuotationSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const quotationPrefix =
    typeof row.quotationPrefix === "string" ? row.quotationPrefix : (pickString(row.quotationPrefix) ?? "");
  const quotationNumber = pickString(row.quotationNumber);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);
  const discountAfterTax = pickNumber(row.discountAfterTax);
  const discountType = pickString(row.discountType);
  const discountTiming = pickString(row.discountTiming);
  const autoRoundOff = row.autoRoundOff;
  const roundOffAmount = pickNumber(row.roundOffAmount);
  const subtotal = pickNumber(row.subtotal);
  const lineTax = pickNumber(row.lineTax);
  const additionalChargesTotal = pickNumber(row.additionalChargesTotal);
  const additionalChargesTax = pickNumber(row.additionalChargesTax);
  const taxableAmount = pickNumber(row.taxableAmount);
  const discountAmount = pickNumber(row.discountAmount);
  const totalBeforeRound = pickNumber(row.totalBeforeRound);
  const theme = pickString(row.theme);

  if (
    !organisationId ||
    !quotationNumber ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt ||
    discountAfterTax === undefined ||
    (discountType !== "percent" && discountType !== "amount") ||
    autoRoundOff === undefined ||
    roundOffAmount === undefined ||
    subtotal === undefined ||
    lineTax === undefined ||
    additionalChargesTotal === undefined ||
    additionalChargesTax === undefined ||
    taxableAmount === undefined ||
    discountAmount === undefined ||
    totalBeforeRound === undefined ||
    !theme
  ) {
    return null;
  }

  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems
        .map((line) => normalizeQuotationLineItem(line))
        .filter((line): line is NonNullable<typeof line> => line !== null)
    : [];

  const additionalCharges = Array.isArray(row.additionalCharges)
    ? row.additionalCharges
        .map((charge) => {
          const c = asRecord(charge);
          if (!c) return null;
          const chargeId = pickString(c.chargeId);
          const label = pickString(c.label) ?? "";
          const amount = pickNumber(c.amount);
          const taxPercent = pickNumber(c.taxPercent);
          if (!chargeId || amount === undefined || taxPercent === undefined) return null;
          return { chargeId, label, amount, taxPercent };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
    : [];

  return {
    ...summary,
    organisationId,
    quotationPrefix,
    quotationNumber,
    lineItems,
    additionalCharges,
    discountAfterTax,
    discountType: discountType as "percent" | "amount",
    discountTiming: normalizeDiscountTiming(discountTiming),
    autoRoundOff: Boolean(autoRoundOff),
    roundOffAmount,
    subtotal,
    lineTax,
    additionalChargesTotal,
    additionalChargesTax,
    taxableAmount,
    discountAmount,
    totalBeforeRound,
    theme,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.terms) && { terms: pickString(row.terms) }),
    ...(pickString(row.partyPhone) && { partyPhone: pickString(row.partyPhone) }),
    ...(pickString(row.convertedInvoiceId) && { convertedInvoiceId: pickString(row.convertedInvoiceId) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
    ...(row.bankAccount && typeof row.bankAccount === "object"
      ? { bankAccount: row.bankAccount as QuotationDetail["bankAccount"] }
      : {}),
  };
}

export function normalizeQuotationListResponse(body: unknown): QuotationListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeQuotationSummary(item))
      .filter((item): item is QuotationSummary => item !== null),
    pagination,
  };
}

export function normalizeQuotationDetailResponse(body: unknown): QuotationDetail | null {
  return normalizeQuotationDetail(unwrapData(body));
}
