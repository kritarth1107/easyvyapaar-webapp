import {
  extractAiBackendError,
  normalizeAiChatResponse,
  normalizeAiConversationDetail,
  normalizeAiConversationList,
} from "@/lib/api/ai-chat";
import type {
  AiChatRequest,
  AiChatResponse,
  AiConversationDetail,
  AiConversationListResponse,
} from "@/lib/types/ai-chat-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAiConversations(organisationId: string): Promise<AiConversationListResponse> {
  const search = new URLSearchParams({ organisationId });
  const res = await fetch(`/api/ai/conversations?${search.toString()}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractAiBackendError(body) ?? "Failed to load chat history");
  }
  return normalizeAiConversationList(body);
}

export async function fetchAiConversation(
  organisationId: string,
  conversationId: string,
): Promise<AiConversationDetail> {
  const search = new URLSearchParams({ organisationId });
  const res = await fetch(
    `/api/ai/conversations/${encodeURIComponent(conversationId)}?${search.toString()}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractAiBackendError(body) ?? "Failed to load conversation");
  }
  const data = normalizeAiConversationDetail(body);
  if (!data) {
    throw new Error("Invalid conversation response");
  }
  return data;
}

export async function sendAiChatMessage(payload: AiChatRequest): Promise<AiChatResponse> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractAiBackendError(body) ?? "AI chat failed");
  }
  const data = normalizeAiChatResponse(body);
  if (!data) {
    throw new Error("Invalid AI response");
  }
  return data;
}
