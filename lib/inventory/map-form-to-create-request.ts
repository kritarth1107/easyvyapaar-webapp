import type { CreateInventoryItemRequest } from "@/lib/types/inventory-api";
import type { CreateItemFormState } from "@/lib/inventory/create-item-form";

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapFormToCreateItemRequest(
  form: CreateItemFormState,
  organisationId: string,
): CreateInventoryItemRequest {
  const lowStockQty = parseOptionalNumber(form.lowStockQty) ?? 0;

  return {
    organisationId,
    categoryId: form.categoryId.trim(),
    itemType: form.itemType,
    name: form.name.trim(),
    showInOnlineStore: form.showInOnlineStore,
    salesPrice: parseOptionalNumber(form.salesPrice) ?? 0,
    salesTaxMode: form.salesTaxMode,
    purchasePrice: parseOptionalNumber(form.purchasePrice) ?? 0,
    purchaseTaxMode: form.purchaseTaxMode,
    gstRate: form.gstRate,
    salesDiscountPercent: parseOptionalNumber(form.salesDiscountPercent) ?? 0,
    unit: form.unit.trim(),
    openingStock: parseOptionalNumber(form.openingStock) ?? 0,
    serialised: form.serialised,
    serialNumbers: form.serialised
      ? form.serialNumbers
          .filter((row) => row.serialNumber.trim())
          .map((row) => ({
            serialNumber: row.serialNumber.trim(),
            dateCreated: row.dateCreated,
          }))
      : [],
    itemCode: form.itemCode.trim(),
    ...(form.hsn.trim() && { hsn: form.hsn.trim() }),
    asOfDate: form.asOfDate,
    lowStockWarning: form.lowStockWarning,
    lowStockQty: form.lowStockWarning ? lowStockQty : 0,
    ...(form.description.trim() && { description: form.description.trim() }),
    partyPrices: form.partyPrices
      .filter((row) => row.partyName.trim() && row.price.trim())
      .map((row) => ({
        partyId: row.partyName.trim(),
        price: parseOptionalNumber(row.price) ?? 0,
      })),
    purchaseSuppliers: form.purchaseSuppliers
      .map((row) => row.partyId.trim())
      .filter(Boolean)
      .filter((partyId, index, list) => list.indexOf(partyId) === index)
      .map((partyId) => ({ partyId })),
    customFields: form.customFields
      .filter((row) => row.label.trim() && row.value.trim())
      .map((row) => ({
        field: row.label.trim(),
        value: row.value.trim(),
      })),
  };
}
