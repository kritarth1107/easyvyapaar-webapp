import { extractBackendError } from "@/lib/api/inventory";

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function downloadGstr1PortalJson(
  organisationId: string,
  fromDate?: string,
  toDate?: string,
): Promise<void> {
  const qs = new URLSearchParams({ organisationId });
  if (fromDate) qs.set("fromDate", fromDate);
  if (toDate) qs.set("toDate", toDate);
  const res = await fetch(`/api/reports/gstr1/portal-export?${qs.toString()}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to export GSTR-1");
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const data = root && root.success === true ? (root.data as Record<string, unknown>) : root;
  if (!data || typeof data !== "object") throw new Error("Invalid export response");
  const filename = typeof data.filename === "string" ? data.filename : "GSTR1_export.json";
  const payload = data.payload ?? data;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadTallyXml(
  organisationId: string,
  fromDate?: string,
  toDate?: string,
): Promise<void> {
  const qs = new URLSearchParams({ organisationId });
  if (fromDate) qs.set("fromDate", fromDate);
  if (toDate) qs.set("toDate", toDate);
  const res = await fetch(`/api/reports/tally-export?${qs.toString()}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to export Tally XML");
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const data = root && root.success === true ? (root.data as Record<string, unknown>) : root;
  if (!data || typeof data !== "object") throw new Error("Invalid export response");
  const filename = typeof data.filename === "string" ? data.filename : "TallyExport.xml";
  const xml = typeof data.xml === "string" ? data.xml : "";
  if (!xml) throw new Error("Empty Tally XML");
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
