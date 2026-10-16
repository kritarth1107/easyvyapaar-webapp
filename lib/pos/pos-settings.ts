import type { InvoiceThemeId } from "@/lib/sales/invoice-settings-config";

export type PosPrinterType = "a4" | "thermal58" | "thermal80";

export function normalisePosPrinterType(value: unknown): PosPrinterType {
  if (value === "thermal58") return "thermal58";
  // Legacy "thermal" value (pre 58/80 split) maps to the common 80mm roll.
  if (value === "thermal80" || value === "thermal") return "thermal80";
  return "a4";
}

export function posThermalWidth(printerType: PosPrinterType): 58 | 80 | null {
  if (printerType === "thermal58") return 58;
  if (printerType === "thermal80") return 80;
  return null;
}

export type PosSettings = {
  hideCustomer: boolean;
  fullyPaid: boolean;
  roundOff: boolean;
  hideMrp: boolean;
  printerType: PosPrinterType;
};

export const DEFAULT_POS_SETTINGS: PosSettings = {
  hideCustomer: false,
  fullyPaid: true,
  roundOff: true,
  hideMrp: false,
  printerType: "a4",
};

const STORAGE_KEY = "mahajaan.pos.settings";

export function loadPosSettings(): PosSettings {
  if (typeof window === "undefined") return DEFAULT_POS_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POS_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PosSettings>;
    return {
      hideCustomer: Boolean(parsed.hideCustomer),
      fullyPaid: parsed.fullyPaid !== false,
      roundOff: parsed.roundOff !== false,
      hideMrp: Boolean(parsed.hideMrp),
      printerType: normalisePosPrinterType(parsed.printerType),
    };
  } catch {
    return DEFAULT_POS_SETTINGS;
  }
}

export function savePosSettings(settings: PosSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function posPrinterToTheme(printerType: PosPrinterType): InvoiceThemeId {
  return printerType === "a4" ? "gst-advance-a4" : "billbook-a5";
}
