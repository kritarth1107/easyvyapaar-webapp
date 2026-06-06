import { NextResponse } from "next/server";
import { extractBackendError, normalizeCashBankSummary } from "@/lib/api/cash-bank";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/cash-bank`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load cash & bank" },
        { status: response.status },
      );
    }

    const data = normalizeCashBankSummary(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Cash bank summary error:", error);
    return NextResponse.json({ error: "Failed to load cash & bank" }, { status: 500 });
  }
}
