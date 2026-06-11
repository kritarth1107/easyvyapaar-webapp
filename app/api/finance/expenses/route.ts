import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeExpenseDetailResponse,
  normalizeExpenseListResponse,
} from "@/lib/api/expenses";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["status", "search", "fromDate", "toDate", "page", "limit"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const category = searchParams.get("categoryId")?.trim() || searchParams.get("category")?.trim();
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/expenses${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load expenses" },
        { status: response.status },
      );
    }

    const data = normalizeExpenseListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Expenses list error:", error);
    return NextResponse.json({ error: "Failed to load expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let init: RequestInit;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      init = { method: "POST", body: formData };
    } else {
      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      init = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
    }

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/expenses`,
      init,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create expense" },
        { status: response.status },
      );
    }

    const expense = normalizeExpenseDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: expense }, { status: response.status });
  } catch (error) {
    console.error("Expense create error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
