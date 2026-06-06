import { NextResponse } from "next/server";
import { searchHsnCatalog } from "@/lib/inventory/hsn-catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const limitRaw = Number(searchParams.get("limit") ?? "60");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 60;

    if (q.length < 2) {
      return NextResponse.json({ data: [], total: 0, query: q });
    }

    const results = searchHsnCatalog(q, limit);
    return NextResponse.json({ data: results, total: results.length, query: q });
  } catch (error) {
    console.error("HSN search error:", error);
    return NextResponse.json({ error: "Failed to search HSN codes" }, { status: 500 });
  }
}
