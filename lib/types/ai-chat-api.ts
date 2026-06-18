export type AiRichCard =
  | {
      kind: "summary";
      title?: string;
      total: string;
      bills: string;
      trend: string;
      rows: { label: string; value: string }[];
      sections?: Array<{
        heading?: string;
        rows: { label: string; value: string }[];
      }>;
    }
  | { kind: "stock"; name: string; qty: string; status: "ok" | "low"; hint: string }
  | { kind: "invoice"; id: string; party: string; total: string; actions: string[]; href?: string }
  | { kind: "ledger"; party: string; amount: string; overdue: string }
  | { kind: "list"; title: string; items: string[]; action: string };

export type AiChatRole = "user" | "assistant";

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  text: string;
  card?: AiRichCard;
  createdAt: string;
};

export type AiChatHistoryItem = {
  role: AiChatRole;
  content: string;
};

export type AiChatRequest = {
  organisationId: string;
  message: string;
  conversationId?: string;
  history?: AiChatHistoryItem[];
};

export type AiChatResponse = {
  reply: string;
  card?: AiRichCard;
  conversationId: string;
};

export type AiConversationSummary = {
  conversationId: string;
  title: string;
  lastMessagePreview?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AiConversationListResponse = {
  items: AiConversationSummary[];
};

export type AiConversationDetail = {
  conversationId: string;
  title: string;
  messages: Array<{
    messageId: string;
    role: AiChatRole;
    content: string;
    card?: AiRichCard;
    createdAt: string;
  }>;
};
