import { NextResponse } from "next/server";
import { extractAiBackendError, normalizeAiConversationList } from "@/lib/api/ai-chat";
import { proxyAiBackend } from "@/lib/api/ai-proxy";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisationId")?.trim() ?? "";
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyAiBackend(
      request,
      `ai/organisations/${encodeURIComponent(organisationId)}/conversations`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractAiBackendError(body) ?? "Failed to load chat history" },
        { status: response.status },
      );
    }

    const data = normalizeAiConversationList(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("AI conversations list error:", error);
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}
