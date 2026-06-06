import {
  extractBackendError,
  normalizeSalesInvoiceSettingsResponse,
} from "@/lib/api/sales-invoice-settings";
import type { StoredSalesInvoiceSettings } from "@/lib/sales/invoice-settings-config";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSalesInvoiceSettings(
  organisationId: string,
): Promise<StoredSalesInvoiceSettings> {
  const res = await fetch(
    `/api/sales/invoice-settings?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load invoice settings");
  }
  const data = normalizeSalesInvoiceSettingsResponse(body);
  if (!data) {
    throw new Error("Failed to load invoice settings");
  }
  return data.settings;
}

export async function updateSalesInvoiceSettings(
  organisationId: string,
  settings: StoredSalesInvoiceSettings,
): Promise<StoredSalesInvoiceSettings> {
  const res = await fetch(
    `/api/sales/invoice-settings?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to save invoice settings");
  }
  const data = normalizeSalesInvoiceSettingsResponse(body);
  if (!data) {
    throw new Error("Failed to save invoice settings");
  }
  return data.settings;
}
