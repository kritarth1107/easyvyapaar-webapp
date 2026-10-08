import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/sales";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type RouteContext = { params: Promise<{ invoiceId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    const { invoiceId } = await context.params;
    const trimmed = invoiceId?.trim();
    if (!trimmed) return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
    let payload: unknown = {};
    try { payload = await request.json(); } catch { payload = {}; }
    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/invoices/${encodeURIComponent(trimmed)}/e-way-bill/generate`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload ?? {}) },
    );
    if (!response.ok) return NextResponse.json({ error: extractBackendError(body) ?? "Failed to generate E-Way Bill" }, { status: response.status });
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("E-Way Bill generate error:", error);
    return NextResponse.json({ error: "Failed to generate E-Way Bill" }, { status: 500 });
  }
}
