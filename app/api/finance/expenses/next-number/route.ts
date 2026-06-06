import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextExpenseNumber } from "@/lib/api/expenses";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/expenses/next-number`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load expense number" },
        { status: response.status },
      );
    }

    const data = normalizeNextExpenseNumber(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Expense next-number error:", error);
    return NextResponse.json({ error: "Failed to load expense number" }, { status: 500 });
  }
}
