import type { SalesInvoiceDetail, SalesInvoiceLineItem } from "@/lib/types/sales-api";
import type {
  CreateCreditNoteRequest,
  CreditNoteDetail,
  CreditNoteSettlementMode,
  CreditNoteType,
} from "@/lib/types/credit-notes-api";
import {
  calcReturnLineAmount,
  calcReturnTotal,
  getMaxReturnableQty,
  getReturnedQtyByInvoiceLine,
  getReturnedSerialsByInvoiceLine,
  getReturnableSerials,
  normalizeSerial,
  serialsMatch,
} from "@/lib/sales/map-create-sales-return-request";

export type NoteLineDraft = {
  invoiceLineId: string;
  noteQty: number;
  selectedSerials: string[];
};

export type CreateCreditNoteFormState = {
  noteType: CreditNoteType;
  invoiceId: string;
  notePrefix: string;
  noteNumber: string;
  noteDate: string;
  reason: string;
  notes: string;
  settlementMode: CreditNoteSettlementMode;
  lines: NoteLineDraft[];
};

export {
  calcReturnLineAmount as calcNoteLineAmount,
  calcReturnTotal as calcNoteTotal,
  getMaxReturnableQty,
  getReturnableSerials,
  normalizeSerial,
  serialsMatch,
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcNoteTotalFromDrafts(
  invoice: SalesInvoiceDetail,
  lines: NoteLineDraft[],
): number {
  let total = 0;
  for (const draft of lines) {
    if (draft.noteQty <= 0) continue;
    const invoiceLine = invoice.lineItems.find((row) => row.lineId === draft.invoiceLineId);
    if (!invoiceLine) continue;
    total += calcReturnLineAmount(invoiceLine, draft.noteQty);
  }
  return roundMoney(total);
}

export function mapCreateCreditNoteFormToRequest(
  invoice: SalesInvoiceDetail,
  form: CreateCreditNoteFormState,
): CreateCreditNoteRequest {
  const lineItems = form.lines
    .filter((draft) => draft.noteQty > 0)
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
        qty: draft.noteQty,
        unit: invoiceLine.unit,
        pricePerItem: invoiceLine.pricePerItem,
        discount: invoiceLine.discount,
        discountType: invoiceLine.discountType,
        gstPercent: invoiceLine.gstPercent,
        salesTaxMode: invoiceLine.salesTaxMode,
        ...(draft.selectedSerials.length > 0 ? { serialNumbers: draft.selectedSerials } : {}),
      };
    });

  const settlementAmount = calcNoteTotalFromDrafts(invoice, form.lines);

  return {
    noteType: form.noteType,
    invoiceId: form.invoiceId,
    notePrefix: form.notePrefix.trim() || undefined,
    noteNumber: form.noteNumber.trim() || undefined,
    noteDate: form.noteDate,
    status: "completed",
    reason: form.reason.trim() || undefined,
    notes: form.notes.trim() || undefined,
    lineItems,
    settlementAmount,
    settlementMode: form.settlementMode,
  };
}

export function buildNoteLineDrafts(invoice: SalesInvoiceDetail): NoteLineDraft[] {
  return invoice.lineItems.map((line) => ({
    invoiceLineId: line.lineId,
    noteQty: 0,
    selectedSerials: [],
  }));
}

type PriorNoteLine = { invoiceLineId: string; qty: number; serialNumbers?: string[] };

export function getCreditedQtyByInvoiceLine(
  priorReturns: Array<{ lineItems: PriorNoteLine[]; status: string; noteType?: CreditNoteType }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of priorReturns) {
    if (row.status !== "completed") continue;
    if (row.noteType === "debit") continue;
    for (const line of row.lineItems) {
      map.set(line.invoiceLineId, (map.get(line.invoiceLineId) ?? 0) + line.qty);
    }
  }
  return map;
}

export function getCreditedSerialsByInvoiceLine(
  priorReturns: Array<{
    lineItems: Array<{ invoiceLineId: string; serialNumbers?: string[] }>;
    status: string;
    noteType?: CreditNoteType;
  }>,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const row of priorReturns) {
    if (row.status !== "completed") continue;
    if (row.noteType === "debit") continue;
    for (const line of row.lineItems) {
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

export function mergePriorAdjustments(
  salesReturns: Array<{ lineItems: PriorNoteLine[]; status: string }>,
  creditNotes: Array<{ lineItems: PriorNoteLine[]; status: string; noteType: CreditNoteType }>,
) {
  const qtyMap = getReturnedQtyByInvoiceLine(salesReturns);
  const creditQtyMap = getCreditedQtyByInvoiceLine(creditNotes);
  for (const [lineId, qty] of creditQtyMap) {
    qtyMap.set(lineId, (qtyMap.get(lineId) ?? 0) + qty);
  }

  const serialMap = getReturnedSerialsByInvoiceLine(salesReturns);
  const creditSerialMap = getCreditedSerialsByInvoiceLine(creditNotes);
  for (const [lineId, serials] of creditSerialMap) {
    const set = serialMap.get(lineId) ?? new Set<string>();
    for (const serial of serials) set.add(serial);
    serialMap.set(lineId, set);
  }

  return { qtyMap, serialMap };
}

export function getMaxNoteQty(
  noteType: CreditNoteType,
  invoiceLine: SalesInvoiceLineItem,
  alreadyCredited: number,
): number {
  if (noteType === "debit") return 999999;
  return getMaxReturnableQty(invoiceLine, alreadyCredited);
}

export function toPriorNoteShape(detail: CreditNoteDetail) {
  return {
    lineItems: detail.lineItems,
    status: detail.status,
    noteType: detail.noteType,
  };
}
