import { extractBackendError } from "@/lib/api/inventory";
import { inferSalesTaxMode, normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import { normalizeDiscountTiming } from "@/lib/sales/invoice-totals";
import type {
  NextInvoiceNumber,
  SalesInvoiceDetail,
  SalesInvoiceListResponse,
  SalesInvoiceSummary,
} from "@/lib/types/sales-api";

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

export function normalizeNextInvoiceNumber(raw: unknown): NextInvoiceNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const invoicePrefix = pickString(row.invoicePrefix);
  const invoiceNumber = pickString(row.invoiceNumber);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!invoicePrefix || !invoiceNumber || !suggestedDisplay) return null;
  return { invoicePrefix, invoiceNumber, suggestedDisplay };
}

export function normalizeSalesInvoiceSummary(raw: unknown): SalesInvoiceSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const invoiceId = pickString(row.invoiceId);
  const displayNumber = pickString(row.displayNumber);
  const partyName = pickString(row.partyName);
  const invoiceDate = pickString(row.invoiceDate);
  const status = pickString(row.status) as SalesInvoiceSummary["status"] | undefined;
  const totalAmount = pickNumber(row.totalAmount);
  const amountReceived = pickNumber(row.amountReceived);
  const balanceAmount = pickNumber(row.balanceAmount);

  if (
    !invoiceId ||
    !displayNumber ||
    !partyName ||
    !invoiceDate ||
    !status ||
    totalAmount === undefined ||
    amountReceived === undefined ||
    balanceAmount === undefined
  ) {
    return null;
  }

  return {
    invoiceId,
    displayNumber,
    partyName,
    invoiceDate,
    totalAmount,
    amountReceived,
    balanceAmount,
    status,
    isCashSale: Boolean(row.isCashSale),
    invoiceType:
      pickString(row.invoiceType) === "gst_invoice" ? "gst_invoice" : "cash_memo",
    ...(pickString(row.partyId) && { partyId: pickString(row.partyId) }),
    ...(pickString(row.dueDate) && { dueDate: pickString(row.dueDate) }),
    ...(pickString(row.partyGstin) && { partyGstin: pickString(row.partyGstin) }),
    ...(pickString(row.placeOfSupply) && { placeOfSupply: pickString(row.placeOfSupply) }),
  };
}

export function normalizeSalesInvoiceDetail(raw: unknown): SalesInvoiceDetail | null {
  const summary = normalizeSalesInvoiceSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const invoicePrefix =
    typeof row.invoicePrefix === "string" ? row.invoicePrefix : (pickString(row.invoicePrefix) ?? "");
  const invoiceNumber = pickString(row.invoiceNumber);
  const paymentTermsDays = pickNumber(row.paymentTermsDays);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);
  const paymentMode = pickString(row.paymentMode);
  const theme = pickString(row.theme);
  const discountType = pickString(row.discountType) as SalesInvoiceDetail["discountType"] | undefined;

  if (
    !organisationId ||
    !invoiceNumber ||
    paymentTermsDays === undefined ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt ||
    !paymentMode ||
    !theme ||
    !discountType
  ) {
    return null;
  }

  const lineItemsRaw = Array.isArray(row.lineItems) ? row.lineItems : [];
  const lineItems = lineItemsRaw
    .map((item) => {
      const line = asRecord(item);
      if (!line) return null;
      const lineId = pickString(line.lineId);
      const itemId = pickString(line.itemId);
      const name = pickString(line.name);
      const qty = pickNumber(line.qty);
      const pricePerItem = pickNumber(line.pricePerItem);
      const discount = pickNumber(line.discount);
      const gstPercent = pickNumber(line.gstPercent);
      const taxable = pickNumber(line.taxable);
      const tax = pickNumber(line.tax);
      const amount = pickNumber(line.amount);
      const lineDiscountType = pickString(line.discountType) as "percent" | "amount" | undefined;
      if (
        !lineId ||
        !itemId ||
        !name ||
        qty === undefined ||
        pricePerItem === undefined ||
        discount === undefined ||
        !lineDiscountType ||
        gstPercent === undefined ||
        taxable === undefined ||
        tax === undefined ||
        amount === undefined
      ) {
        return null;
      }
      const serialNumbers = Array.isArray(line.serialNumbers)
        ? line.serialNumbers
            .map((s) => {
              if (typeof s === "string") return s.trim();
              if (typeof s === "number" && Number.isFinite(s)) return String(s).trim();
              return "";
            })
            .filter((s) => s.length > 0)
        : undefined;

      const rawSalesTaxMode = pickString(line.salesTaxMode);
      const salesTaxMode =
        rawSalesTaxMode === "with_tax" || rawSalesTaxMode === "without_tax"
          ? rawSalesTaxMode
          : inferSalesTaxMode({ qty, pricePerItem, gstPercent, amount });

      return {
        lineId,
        itemId,
        name,
        hsn: pickString(line.hsn) ?? "",
        qty,
        unit: pickString(line.unit) ?? "",
        pricePerItem,
        discount,
        discountType: lineDiscountType,
        gstPercent,
        salesTaxMode: normalizeSalesTaxMode(salesTaxMode),
        taxable,
        tax,
        amount,
        ...(serialNumbers?.length ? { serialNumbers } : {}),
        ...(pickString(line.supplierId) ? { supplierId: pickString(line.supplierId) } : {}),
        ...(pickString(line.supplierName) ? { supplierName: pickString(line.supplierName) } : {}),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (lineItems.length === 0) return null;

  const additionalChargesRaw = Array.isArray(row.additionalCharges) ? row.additionalCharges : [];
  const additionalCharges = additionalChargesRaw
    .map((charge) => {
      const c = asRecord(charge);
      if (!c) return null;
      const chargeId = pickString(c.chargeId) ?? pickString(c.id) ?? "";
      const label = pickString(c.label) ?? "";
      const amount = pickNumber(c.amount) ?? 0;
      const taxPercent = pickNumber(c.taxPercent) ?? 0;
      if (!chargeId) return null;
      return { chargeId, label, amount, taxPercent };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const bankRow = asRecord(row.bankAccount);
  const bankAccount = bankRow
    ? {
        ...(pickString(bankRow.bankAccountId) && { bankAccountId: pickString(bankRow.bankAccountId) }),
        ...(pickString(bankRow.accountHolderName) && {
          accountHolderName: pickString(bankRow.accountHolderName),
        }),
        ...(pickString(bankRow.bankName) && { bankName: pickString(bankRow.bankName) }),
        ...(pickString(bankRow.accountNumber) && { accountNumber: pickString(bankRow.accountNumber) }),
        ...(pickString(bankRow.ifscCode) && { ifscCode: pickString(bankRow.ifscCode) }),
        ...(pickString(bankRow.branchName) && { branchName: pickString(bankRow.branchName) }),
      }
    : undefined;

  return {
    ...summary,
    organisationId,
    invoicePrefix,
    invoiceNumber,
    paymentTermsDays,
    lineItems,
    additionalCharges,
    discountAfterTax: pickNumber(row.discountAfterTax) ?? 0,
    discountType,
    discountTiming: normalizeDiscountTiming(pickString(row.discountTiming)),
    autoRoundOff: Boolean(row.autoRoundOff),
    roundOffAmount: pickNumber(row.roundOffAmount) ?? 0,
    subtotal: pickNumber(row.subtotal) ?? 0,
    lineTax: pickNumber(row.lineTax) ?? 0,
    additionalChargesTotal: pickNumber(row.additionalChargesTotal) ?? 0,
    additionalChargesTax: pickNumber(row.additionalChargesTax) ?? 0,
    taxableAmount: pickNumber(row.taxableAmount) ?? 0,
    discountAmount: pickNumber(row.discountAmount) ?? 0,
    totalBeforeRound: pickNumber(row.totalBeforeRound) ?? 0,
    paymentMode,
    theme,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(typeof row.notes === "string" ? { notes: row.notes.trim() } : {}),
    ...(typeof row.terms === "string" ? { terms: row.terms.trim() } : {}),
    ...(bankAccount && Object.keys(bankAccount).length > 0 ? { bankAccount } : {}),
    ...(pickString(row.partyPhone) && { partyPhone: pickString(row.partyPhone) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizeSalesInvoiceListResponse(body: unknown): SalesInvoiceListResponse {
  const data = unwrapData(body);
  const dataRow = asRecord(data);
  const itemsRaw = Array.isArray(data)
    ? data
    : Array.isArray(dataRow?.items)
      ? dataRow.items
      : [];

  const paginationRow = asRecord(dataRow?.pagination);
  const pagination = {
    page: pickNumber(paginationRow?.page) ?? 1,
    limit: pickNumber(paginationRow?.limit) ?? itemsRaw.length,
    total: pickNumber(paginationRow?.total) ?? itemsRaw.length,
    totalPages: pickNumber(paginationRow?.totalPages) ?? (itemsRaw.length > 0 ? 1 : 0),
  };

  return {
    items: itemsRaw
      .map((item) => normalizeSalesInvoiceSummary(item))
      .filter((item): item is SalesInvoiceSummary => item !== null),
    pagination,
  };
}

export function normalizeSalesInvoiceDetailResponse(body: unknown): SalesInvoiceDetail | null {
  const data = unwrapData(body);
  return normalizeSalesInvoiceDetail(data);
}
