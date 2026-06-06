import type { InventoryBillPick } from "@/lib/dashboard/mock-inventory-items";
import type {
  CreateDeliveryChallanRequest,
  DeliveryChallanStatus,
} from "@/lib/types/delivery-challans-api";
import type { SalesInvoiceDetail } from "@/lib/types/sales-api";

export type DeliveryChallanLineDraft = {
  id: string;
  itemId: string;
  name: string;
  hsn: string;
  unit: string;
  qty: number;
  serialised: boolean;
  serialNumbers: string[];
  pricePerItem: number;
};

export type CreateDeliveryChallanFormState = {
  challanPrefix: string;
  challanNumber: string;
  challanDate: string;
  deliveryDate: string;
  invoiceId: string;
  invoiceDisplayNumber: string;
  shippingAddress: string;
  vehicleNumber: string;
  transportRef: string;
  notes: string;
  lines: DeliveryChallanLineDraft[];
};

function newLineId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function lineDraftFromInventoryPick(
  pick: InventoryBillPick,
  existingLines: DeliveryChallanLineDraft[],
): DeliveryChallanLineDraft | null {
  if (pick.item.serialised) {
    const serialNumber = pick.serialNumbers?.[0]?.trim();
    if (!serialNumber) return null;
    const duplicate = existingLines.some(
      (line) => line.itemId === pick.item.id && line.serialNumbers.includes(serialNumber),
    );
    if (duplicate) return null;
    return {
      id: newLineId(),
      itemId: pick.item.id,
      name: pick.item.name,
      hsn: pick.item.hsn,
      unit: pick.item.unit,
      qty: 1,
      serialised: true,
      serialNumbers: [serialNumber],
      pricePerItem: pick.item.salePrice ?? 0,
    };
  }

  const existing = existingLines.find((line) => line.itemId === pick.item.id && !line.serialised);
  if (existing) return null;

  return {
    id: newLineId(),
    itemId: pick.item.id,
    name: pick.item.name,
    hsn: pick.item.hsn,
    unit: pick.item.unit,
    qty: 1,
    serialised: false,
    serialNumbers: [],
    pricePerItem: pick.item.salePrice ?? 0,
  };
}

export function buildChallanLinesFromInvoice(invoice: SalesInvoiceDetail): DeliveryChallanLineDraft[] {
  return invoice.lineItems.map((line) => ({
    id: newLineId(),
    itemId: line.itemId,
    name: line.name,
    hsn: line.hsn,
    unit: line.unit,
    qty: line.qty,
    serialised: Boolean(line.serialNumbers?.length),
    serialNumbers: line.serialNumbers ?? [],
    pricePerItem: line.pricePerItem,
  }));
}

export function mergeInventoryPickIntoChallanLines(
  lines: DeliveryChallanLineDraft[],
  pick: InventoryBillPick,
): DeliveryChallanLineDraft[] {
  if (pick.item.serialised) {
    let nextLines = lines;
    for (const serialNumber of pick.serialNumbers ?? []) {
      const draft = lineDraftFromInventoryPick(
        { ...pick, serialNumbers: [serialNumber] },
        nextLines,
      );
      if (draft) nextLines = [...nextLines, draft];
    }
    return nextLines;
  }

  const draft = lineDraftFromInventoryPick(pick, lines);
  if (!draft) return lines;
  return [...lines, draft];
}

export function mapCreateDeliveryChallanFormToRequest(
  form: CreateDeliveryChallanFormState,
  partyId: string,
  options?: { status?: "draft" | "dispatched" | "delivered" },
): CreateDeliveryChallanRequest {
  return {
    partyId,
    challanPrefix: form.challanPrefix.trim(),
    challanNumber: form.challanNumber.trim(),
    challanDate: form.challanDate,
    ...(form.deliveryDate.trim() ? { deliveryDate: form.deliveryDate.trim() } : {}),
    ...(form.invoiceId.trim() ? { invoiceId: form.invoiceId.trim() } : {}),
    status: options?.status ?? "draft",
    ...(form.shippingAddress.trim() ? { shippingAddress: form.shippingAddress.trim() } : {}),
    ...(form.vehicleNumber.trim() ? { vehicleNumber: form.vehicleNumber.trim() } : {}),
    ...(form.transportRef.trim() ? { transportRef: form.transportRef.trim() } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    lineItems: form.lines.map((line) => ({
      itemId: line.itemId,
      name: line.name,
      hsn: line.hsn,
      qty: line.qty,
      unit: line.unit,
      pricePerItem: line.pricePerItem,
      ...(line.serialised && line.serialNumbers.length
        ? { serialNumbers: line.serialNumbers }
        : {}),
    })),
  };
}

export function canCancelChallan(status: DeliveryChallanStatus): boolean {
  return status === "draft" || status === "dispatched";
}

export function nextStatusForAction(
  current: DeliveryChallanStatus,
  action: "dispatch" | "deliver" | "cancel",
): DeliveryChallanStatus {
  if (action === "dispatch") return "dispatched";
  if (action === "deliver") return "delivered";
  return "cancelled";
}
