import {
  DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  normalizeAccentColor,
  normalizeThemeId,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import type { SalesInvoiceSettingsResponse } from "@/lib/types/sales-invoice-settings-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function pickNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : null;
}

export function extractBackendError(body: unknown): string | null {
  const root = asRecord(body);
  if (!root) return null;
  if (typeof root.error === "string" && root.error.trim()) return root.error;
  const nested = root.error;
  if (typeof nested === "object" && nested !== null) {
    const err = nested as Record<string, unknown>;
    if (typeof err.details === "string" && err.details.trim()) return err.details;
    if (typeof err.description === "string" && err.description.trim()) return err.description;
  }
  if (typeof root.message === "string" && root.message.trim()) return root.message;
  return null;
}

function normalizeItemColumns(raw: unknown): StoredSalesInvoiceSettings["itemColumns"] {
  const row = asRecord(raw);
  const defaults = DEFAULT_STORED_SALES_INVOICE_SETTINGS.itemColumns;
  if (!row) return { ...defaults };
  return {
    price: pickBoolean(row.price, defaults.price),
    quantity: pickBoolean(row.quantity, defaults.quantity),
    batchNo: pickBoolean(row.batchNo, defaults.batchNo),
    expDate: pickBoolean(row.expDate, defaults.expDate),
    mfgDate: pickBoolean(row.mfgDate, defaults.mfgDate),
  };
}

export function normalizeStoredSalesInvoiceSettings(raw: unknown): StoredSalesInvoiceSettings {
  const row = asRecord(raw);
  const defaults = DEFAULT_STORED_SALES_INVOICE_SETTINGS;
  if (!row) return { ...defaults };

  const signatureSource = row.signatureSource === "draw" ? "draw" : "desktop";

  return {
    themeId: normalizeThemeId(pickString(row.themeId, defaults.themeId)),
    accentColor: normalizeAccentColor(pickString(row.accentColor, defaults.accentColor)),
    showPartyBalance: pickBoolean(row.showPartyBalance, defaults.showPartyBalance),
    enableFreeQty: pickBoolean(row.enableFreeQty, defaults.enableFreeQty),
    showItemDescription: pickBoolean(row.showItemDescription, defaults.showItemDescription),
    showAlternateUnit: pickBoolean(row.showAlternateUnit, defaults.showAlternateUnit),
    showPhoneOnInvoice: pickBoolean(row.showPhoneOnInvoice, defaults.showPhoneOnInvoice),
    showTimeOnInvoice: pickBoolean(row.showTimeOnInvoice, defaults.showTimeOnInvoice),
    priceHistory: pickBoolean(row.priceHistory, defaults.priceHistory),
    industryType: pickString(row.industryType, defaults.industryType),
    showPoNumber: pickBoolean(row.showPoNumber, defaults.showPoNumber),
    showEwayBill: pickBoolean(row.showEwayBill, defaults.showEwayBill),
    showVehicleNumber: pickBoolean(row.showVehicleNumber, defaults.showVehicleNumber),
    partyCustomField: pickString(row.partyCustomField, defaults.partyCustomField),
    itemColumns: normalizeItemColumns(row.itemColumns),
    paymentQr: pickString(row.paymentQr, defaults.paymentQr),
    termsPreset: pickString(row.termsPreset, defaults.termsPreset),
    termsText: pickString(row.termsText, defaults.termsText),
    signatureSource,
    signatureDataUrl: pickNullableString(row.signatureDataUrl),
    enableReceiverSignature: pickBoolean(
      row.enableReceiverSignature,
      defaults.enableReceiverSignature,
    ),
    showPrefixSequence: pickBoolean(row.showPrefixSequence, defaults.showPrefixSequence),
    showPurchasePrice: pickBoolean(row.showPurchasePrice, defaults.showPurchasePrice),
    showItemImage: pickBoolean(row.showItemImage, defaults.showItemImage),
  };
}

export function normalizeSalesInvoiceSettingsResponse(
  body: unknown,
): SalesInvoiceSettingsResponse | null {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const row = asRecord(data);
  if (!row) return null;
  return { settings: normalizeStoredSalesInvoiceSettings(row.settings) };
}
