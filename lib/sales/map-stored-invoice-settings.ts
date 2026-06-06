import type { InvoiceSettings } from "@/lib/sales/create-invoice-form";
import {
  normalizeThemeId,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";

export function storedSettingsToInvoiceSettings(
  settings: StoredSalesInvoiceSettings,
): InvoiceSettings {
  return {
    showPrefixSequence: settings.showPrefixSequence,
    showPurchasePrice: settings.showPurchasePrice,
    showItemImage: settings.showItemImage,
    priceHistory: settings.priceHistory,
    theme: settings.themeId,
  };
}

export function mergeInvoiceSettingsIntoStored(
  stored: StoredSalesInvoiceSettings,
  partial: InvoiceSettings,
): StoredSalesInvoiceSettings {
  return {
    ...stored,
    showPrefixSequence: partial.showPrefixSequence,
    showPurchasePrice: partial.showPurchasePrice,
    showItemImage: partial.showItemImage,
    priceHistory: partial.priceHistory,
    themeId: normalizeThemeId(partial.theme),
  };
}
