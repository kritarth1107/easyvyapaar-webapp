import type { InvoiceThemeId } from "@/lib/sales/invoice-settings-config";

export type PosPrinterType = "a4" | "thermal";

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
      printerType: parsed.printerType === "thermal" ? "thermal" : "a4",
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
  return printerType === "thermal" ? "billbook-a5" : "gst-advance-a4";
}
