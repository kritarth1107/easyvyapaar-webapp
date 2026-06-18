import type {
  AiChatResponse,
  AiConversationDetail,
  AiConversationListResponse,
  AiRichCard,
} from "@/lib/types/ai-chat-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function coerceDisplayString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function normalizeRichCard(raw: unknown): AiRichCard | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;

  const kind = coerceDisplayString(row.kind);
  if (kind === "summary") {
    const total = coerceDisplayString(row.total);
    const bills = coerceDisplayString(row.bills);
    const trend = coerceDisplayString(row.trend) ?? "—";
    const title = coerceDisplayString(row.title);
    const rows = Array.isArray(row.rows)
      ? row.rows
          .map((entry) => {
            const item = asRecord(entry);
            const label = coerceDisplayString(item?.label);
            const value = coerceDisplayString(item?.value);
            if (!label || !value) return null;
            return { label, value };
          })
          .filter((entry): entry is { label: string; value: string } => entry !== null)
      : [];
    const sections = Array.isArray(row.sections)
      ? row.sections
          .map((section) => {
            const block = asRecord(section);
            if (!block) return null;
            const heading = coerceDisplayString(block.heading);
            const sectionRows = Array.isArray(block.rows)
              ? block.rows
                  .map((entry) => {
                    const item = asRecord(entry);
                    const label = coerceDisplayString(item?.label);
                    const value = coerceDisplayString(item?.value);
                    if (!label || !value) return null;
                    return { label, value };
                  })
                  .filter((entry): entry is { label: string; value: string } => entry !== null)
              : [];
            if (sectionRows.length === 0) return null;
            return {
              ...(heading ? { heading } : {}),
              rows: sectionRows,
            };
          })
          .filter(
            (entry): entry is { heading?: string; rows: { label: string; value: string }[] } =>
              entry !== null,
          )
      : undefined;
    if (!total || !bills) return undefined;
    return {
      kind: "summary",
      ...(title ? { title } : {}),
      total,
      bills,
      trend,
      rows,
      ...(sections && sections.length > 0 ? { sections } : {}),
    };
  }

  if (kind === "stock") {
    const name = coerceDisplayString(row.name);
    const qty = coerceDisplayString(row.qty);
    const hint = coerceDisplayString(row.hint) ?? "In catalog";
    const status = row.status === "low" ? "low" : "ok";
    if (!name || !qty) return undefined;
    return { kind: "stock", name, qty, status, hint };
  }

  if (kind === "invoice") {
    const id = coerceDisplayString(row.id);
    const party = coerceDisplayString(row.party);
    const total = coerceDisplayString(row.total);
    const actions = Array.isArray(row.actions)
      ? row.actions.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean)
      : [];
    if (!id || !party || !total) return undefined;
    return { kind: "invoice", id, party, total, actions };
  }

  if (kind === "ledger") {
    const party = coerceDisplayString(row.party);
    const amount = coerceDisplayString(row.amount);
    const overdue = coerceDisplayString(row.overdue);
    if (!party || !amount || !overdue) return undefined;
    return { kind: "ledger", party, amount, overdue };
  }

  if (kind === "list") {
    const title = coerceDisplayString(row.title);
    const action = coerceDisplayString(row.action);
    const items = Array.isArray(row.items)
      ? row.items.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean)
      : [];
    if (!title || !action) return undefined;
    return { kind: "list", title, items, action };
  }

  return undefined;
}

export function normalizeAiChatResponse(body: unknown): AiChatResponse | null {
  const root = asRecord(body);
  if (!root || root.success !== true) return null;
  const data = asRecord(root.data);
  if (!data) return null;

  const reply = pickString(data.reply);
  const conversationId = pickString(data.conversationId);
  if (!reply || !conversationId) return null;

  const card = normalizeRichCard(data.card);
  return {
    reply,
    conversationId,
    ...(card ? { card } : {}),
  };
}

export function normalizeAiConversationList(body: unknown): AiConversationListResponse {
  const root = asRecord(body);
  if (!root || root.success !== true) return { items: [] };
  const data = asRecord(root.data);
  if (!data || !Array.isArray(data.items)) return { items: [] };

  const items = data.items
    .map((entry) => {
      const row = asRecord(entry);
      if (!row) return null;
      const conversationId = pickString(row.conversationId);
      const title = pickString(row.title);
      const messageCount = typeof row.messageCount === "number" ? row.messageCount : 0;
      const createdAt = pickString(row.createdAt);
      const updatedAt = pickString(row.updatedAt);
      if (!conversationId || !title || !createdAt || !updatedAt) return null;
      const lastMessagePreview = pickString(row.lastMessagePreview);
      return {
        conversationId,
        title,
        messageCount,
        createdAt,
        updatedAt,
        ...(lastMessagePreview ? { lastMessagePreview } : {}),
      };
    })
    .filter((entry): entry is AiConversationListResponse["items"][number] => entry !== null);

  return { items };
}

export function normalizeAiConversationDetail(body: unknown): AiConversationDetail | null {
  const root = asRecord(body);
  if (!root || root.success !== true) return null;
  const data = asRecord(root.data);
  if (!data) return null;

  const conversationId = pickString(data.conversationId);
  const title = pickString(data.title);
  if (!conversationId || !title || !Array.isArray(data.messages)) return null;

  const messages = data.messages
    .map((entry) => {
      const row = asRecord(entry);
      if (!row) return null;
      const messageId = pickString(row.messageId);
      const role = row.role === "user" || row.role === "assistant" ? row.role : null;
      const content = pickString(row.content);
      const createdAt = pickString(row.createdAt);
      if (!messageId || !role || !content || !createdAt) return null;
      const card = normalizeRichCard(row.card);
      return {
        messageId,
        role,
        content,
        createdAt,
        ...(card ? { card } : {}),
      };
    })
    .filter((entry): entry is AiConversationDetail["messages"][number] => entry !== null);

  return { conversationId, title, messages };
}

export function extractAiBackendError(body: unknown): string | null {
  const root = asRecord(body);
  if (!root) return null;
  const error = asRecord(root.error);
  if (error) {
    const details = pickString(error.details);
    const description = pickString(error.description);
    if (details) return details;
    if (description) return description;
  }
  return pickString(root.message) ?? (typeof root.error === "string" ? root.error.trim() : undefined) ?? null;
}
