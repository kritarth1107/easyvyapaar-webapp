import { NextResponse } from "next/server";
import { extractAiBackendError, normalizeAiChatResponse, normalizeRichCard } from "@/lib/api/ai-chat";
import { proxyAiBackend } from "@/lib/api/ai-proxy";

type ChatBody = {
  organisationId?: string;
  message?: string;
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export async function POST(request: Request) {
  try {
    let body: ChatBody;
    try {
      body = (await request.json()) as ChatBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organisationId = typeof body.organisationId === "string" ? body.organisationId.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      message,
    };
    if (typeof body.conversationId === "string" && body.conversationId.trim()) {
      payload.conversationId = body.conversationId.trim();
    }
    if (Array.isArray(body.history) && body.history.length > 0) {
      payload.history = body.history
        .filter(
          (row) =>
            row &&
            (row.role === "user" || row.role === "assistant") &&
            typeof row.content === "string" &&
            row.content.trim(),
        )
        .slice(-20)
        .map((row) => ({ role: row.role, content: row.content.trim() }));
    }

    const { response, body: backendBody } = await proxyAiBackend(
      request,
      `ai/organisations/${encodeURIComponent(organisationId)}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractAiBackendError(backendBody) ?? "AI chat failed" },
        { status: response.status },
      );
    }

    const data = normalizeAiChatResponse(backendBody);
    const rawPayload = backendBody as { data?: Record<string, unknown> };
    const fallbackCard =
      rawPayload.data?.card !== undefined ? normalizeRichCard(rawPayload.data.card) : undefined;
    if (!data) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
    }

    const merged =
      !data.card && fallbackCard ? { ...data, card: fallbackCard } : data;

    return NextResponse.json({ ...(backendBody as object), data: merged });
  } catch (error) {
    console.error("AI chat route error:", error);
    return NextResponse.json({ error: "AI chat failed" }, { status: 500 });
  }
}
