import type { SalesInvoiceDetail, SalesInvoiceLineItem } from "@/lib/types/sales-api";
import type { CreateSalesReturnRequest, SalesRefundMode } from "@/lib/types/sales-returns-api";

export type ReturnLineDraft = {
  invoiceLineId: string;
  returnQty: number;
  selectedSerials: string[];
};

export type CreateSalesReturnFormState = {
  invoiceId: string;
  returnPrefix: string;
  returnNumber: string;
  returnDate: string;
  reason: string;
  notes: string;
  refundMode: SalesRefundMode;
  lines: ReturnLineDraft[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeSerial(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value).trim();
  return "";
}

export function serialsMatch(a: unknown, b: unknown): boolean {
  const left = normalizeSerial(a);
  const right = normalizeSerial(b);
  return Boolean(left && right && left === right);
}

export function calcReturnLineAmount(line: SalesInvoiceLineItem, returnQty: number): number {
  if (returnQty <= 0) return 0;
  const ratio = returnQty / line.qty;
  return roundMoney(line.amount * ratio);
}

export function calcReturnTotal(
  invoice: SalesInvoiceDetail,
  lines: ReturnLineDraft[],
): number {
  let total = 0;
  for (const draft of lines) {
    if (draft.returnQty <= 0) continue;
    const invoiceLine = invoice.lineItems.find((row) => row.lineId === draft.invoiceLineId);
    if (!invoiceLine) continue;
    total += calcReturnLineAmount(invoiceLine, draft.returnQty);
  }
  return roundMoney(total);
}

export function mapCreateSalesReturnFormToRequest(
  invoice: SalesInvoiceDetail,
  form: CreateSalesReturnFormState,
): CreateSalesReturnRequest {
  const lineItems = form.lines
    .filter((draft) => draft.returnQty > 0)
    .map((draft) => {
      const invoiceLine = invoice.lineItems.find((row) => row.lineId === draft.invoiceLineId);
      if (!invoiceLine) {
        throw new Error("Invoice line not found");
      }
      return {
        invoiceLineId: invoiceLine.lineId,
        itemId: invoiceLine.itemId,
        name: invoiceLine.name,
        hsn: invoiceLine.hsn,
        qty: draft.returnQty,
        unit: invoiceLine.unit,
        pricePerItem: invoiceLine.pricePerItem,
        discount: invoiceLine.discount,
        discountType: invoiceLine.discountType,
        gstPercent: invoiceLine.gstPercent,
        salesTaxMode: invoiceLine.salesTaxMode,
        ...(draft.selectedSerials.length > 0 ? { serialNumbers: draft.selectedSerials } : {}),
      };
    });

  const refundAmount = calcReturnTotal(invoice, form.lines);

  return {
    invoiceId: form.invoiceId,
    returnPrefix: form.returnPrefix.trim() || undefined,
    returnNumber: form.returnNumber.trim() || undefined,
    returnDate: form.returnDate,
    status: "completed",
    reason: form.reason.trim() || undefined,
    notes: form.notes.trim() || undefined,
    lineItems,
    refundAmount,
    refundMode: form.refundMode,
  };
}

export function buildReturnLineDrafts(invoice: SalesInvoiceDetail): ReturnLineDraft[] {
  return invoice.lineItems.map((line) => ({
    invoiceLineId: line.lineId,
    returnQty: 0,
    selectedSerials: [],
  }));
}

export function getReturnedQtyByInvoiceLine(
  priorReturns: Array<{ lineItems: Array<{ invoiceLineId: string; qty: number }>; status: string }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const salesReturn of priorReturns) {
    if (salesReturn.status !== "completed") continue;
    for (const line of salesReturn.lineItems) {
      map.set(line.invoiceLineId, (map.get(line.invoiceLineId) ?? 0) + line.qty);
    }
  }
  return map;
}

export function getReturnedSerialsByInvoiceLine(
  priorReturns: Array<{
    lineItems: Array<{ invoiceLineId: string; serialNumbers?: string[] }>;
    status: string;
  }>,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const salesReturn of priorReturns) {
    if (salesReturn.status !== "completed") continue;
    for (const line of salesReturn.lineItems) {
      if (!line.serialNumbers?.length) continue;
      const set = map.get(line.invoiceLineId) ?? new Set<string>();
      for (const serial of line.serialNumbers) {
        if (serial.trim()) set.add(serial.trim());
      }
      map.set(line.invoiceLineId, set);
    }
  }
  return map;
}

export function getReturnableSerials(
  invoiceLine: SalesInvoiceLineItem,
  returnedSerials: Set<string> | undefined,
): string[] {
  const sold = (invoiceLine.serialNumbers ?? []).map(normalizeSerial).filter(Boolean);
  if (!sold.length) return [];
  if (!returnedSerials?.size) return sold;
  return sold.filter((serial) => !Array.from(returnedSerials).some((row) => serialsMatch(row, serial)));
}

export function getMaxReturnableQty(
  invoiceLine: SalesInvoiceLineItem,
  alreadyReturned: number,
): number {
  return Math.max(0, invoiceLine.qty - alreadyReturned);
}
