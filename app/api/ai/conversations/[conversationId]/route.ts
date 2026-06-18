import { NextResponse } from "next/server";
import { extractAiBackendError, normalizeAiConversationDetail } from "@/lib/api/ai-chat";
import { proxyAiBackend } from "@/lib/api/ai-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await context.params;
    const trimmedId = conversationId?.trim();
    if (!trimmedId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisationId")?.trim() ?? "";
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyAiBackend(
      request,
      `ai/organisations/${encodeURIComponent(organisationId)}/conversations/${encodeURIComponent(trimmedId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractAiBackendError(body) ?? "Failed to load conversation" },
        { status: response.status },
      );
    }

    const data = normalizeAiConversationDetail(body);
    if (!data) {
      return NextResponse.json({ error: "Invalid conversation response" }, { status: 502 });
    }

    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("AI conversation detail error:", error);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
