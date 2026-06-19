import { NextResponse } from "next/server";
import { extractAiBackendError } from "@/lib/api/ai-chat";
import { proxyAiBackend } from "@/lib/api/ai-proxy";

type FeedbackBody = {
  organisationId?: string;
  feedback?: "up" | "down";
};

export async function POST(
  request: Request,
  context: { params: Promise<{ messageId: string }> },
) {
  try {
    const { messageId } = await context.params;
    let body: FeedbackBody;
    try {
      body = (await request.json()) as FeedbackBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organisationId = typeof body.organisationId === "string" ? body.organisationId.trim() : "";
    const feedback = body.feedback;

    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }
    if (feedback !== "up" && feedback !== "down") {
      return NextResponse.json({ error: "feedback must be up or down" }, { status: 400 });
    }

    const { response, body: backendBody } = await proxyAiBackend(
      request,
      `ai/organisations/${encodeURIComponent(organisationId)}/messages/${encodeURIComponent(messageId)}/feedback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractAiBackendError(backendBody) ?? "Failed to save feedback" },
        { status: response.status },
      );
    }

    return NextResponse.json(backendBody);
  } catch (error) {
    console.error("AI feedback route error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
