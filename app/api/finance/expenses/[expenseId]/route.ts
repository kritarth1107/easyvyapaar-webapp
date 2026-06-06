import { NextResponse } from "next/server";
import { extractBackendError, normalizeExpenseDetailResponse } from "@/lib/api/expenses";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

type RouteContext = { params: Promise<{ expenseId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { expenseId } = await context.params;

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/expenses/${encodeURIComponent(expenseId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load expense" },
        { status: response.status },
      );
    }

    const expense = normalizeExpenseDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: expense });
  } catch (error) {
    console.error("Expense detail error:", error);
    return NextResponse.json({ error: "Failed to load expense" }, { status: 500 });
  }
}
