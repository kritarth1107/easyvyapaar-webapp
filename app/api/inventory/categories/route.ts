import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeCategory,
  normalizeCategoryListResponse,
} from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/categories`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load categories" },
        { status: response.status },
      );
    }

    const categories = normalizeCategoryListResponse(body);
    return NextResponse.json({ ...(body as object), data: categories });
  } catch (error) {
    console.error("Inventory categories list error:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const root = (payload ?? {}) as { organisationId?: unknown; name?: unknown };
    const organisationId =
      typeof root.organisationId === "string" ? root.organisationId.trim() : "";
    const name = typeof root.name === "string" ? root.name.trim() : "";

    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/categories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create category" },
        { status: response.status },
      );
    }

    const success = body as { success?: boolean; data?: unknown };
    const normalized = normalizeCategory(success.data);
    if (normalized) {
      return NextResponse.json({ ...(body as object), data: normalized }, { status: response.status });
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("Inventory category create error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
