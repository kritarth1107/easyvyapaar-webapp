export const AI_CHAT_BASE_PATH = "/dashboard/ai-chat";

export function aiChatConversationPath(conversationId: string): string {
  const id = conversationId.trim();
  return `${AI_CHAT_BASE_PATH}/${encodeURIComponent(id)}`;
}
