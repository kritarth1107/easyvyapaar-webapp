"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { AiChatInput } from "@/components/dashboard/ai-chat/ai-chat-input";
import { AiChatHistorySidebar } from "@/components/dashboard/ai-chat/ai-chat-history-sidebar";
import { AiChatMessageRow, AiChatTypingRow } from "@/components/dashboard/ai-chat/ai-chat-message-row";
import { getPersonalizedAiGreeting } from "@/lib/ai/ai-chat-greeting";
import {
  fetchAiConversation,
  fetchAiConversations,
  sendAiChatMessage,
} from "@/lib/ai/ai-chat-api-client";
import { useTranslation } from "@/lib/localization";
import type { AiChatMessage, AiConversationSummary } from "@/lib/types/ai-chat-api";

const QUICK_PROMPTS = [
  "Aaj kitna sale hua?",
  "Iss mahine ka profit batao",
  "Low stock dikhao",
  "Party balance dikhao",
];

function mapDetailToMessages(
  rows: Array<{
    messageId: string;
    role: "user" | "assistant";
    content: string;
    card?: AiChatMessage["card"];
    createdAt: string;
  }>,
): AiChatMessage[] {
  return rows.map((row) => ({
    id: row.messageId,
    role: row.role,
    text: row.content,
    createdAt: row.createdAt,
    ...(row.card ? { card: row.card } : {}),
  }));
}

export function AiChatPage() {
  const { t } = useTranslation();
  const { user, activeOrganisationId, activeOrganisation } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const shopLabel = activeOrganisation?.name ?? "";
  const userName = user?.name ?? "";
  const userId = user?.userId ?? "guest";

  const personalizedGreeting = useMemo(
    () =>
      getPersonalizedAiGreeting({
        userId,
        userName,
        shopName: shopLabel,
      }),
    [userId, userName, shopLabel],
  );

  const isEmptyState = !loadingConversation && messages.length === 0 && !loading;

  const refreshConversations = useCallback(async () => {
    if (!orgId) return;
    setLoadingHistory(true);
    try {
      const list = await fetchAiConversations(orgId);
      setConversations(list.items);
    } catch {
      // keep stale list on background refresh failure
    } finally {
      setLoadingHistory(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setHistoryOpen(false);
  }, []);

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (!orgId || loadingConversation) return;
      setLoadingConversation(true);
      setError(null);
      setActiveConversationId(conversationId);
      setHistoryOpen(false);

      try {
        const detail = await fetchAiConversation(orgId, conversationId);
        setMessages(mapDetailToMessages(detail.messages));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.aiChat.error"));
        setMessages([]);
      } finally {
        setLoadingConversation(false);
      }
    },
    [loadingConversation, orgId, t],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !orgId || loading) return;

      setError(null);
      setInput("");

      const optimisticUser: AiChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUser]);
      setLoading(true);

      try {
        const response = await sendAiChatMessage({
          organisationId: orgId,
          message: trimmed,
          ...(activeConversationId ? { conversationId: activeConversationId } : {}),
        });

        setActiveConversationId(response.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: response.reply,
            ...(response.card ? { card: response.card } : {}),
            createdAt: new Date().toISOString(),
          },
        ]);
        void refreshConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.aiChat.error"));
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticUser.id));
      } finally {
        setLoading(false);
      }
    },
    [activeConversationId, loading, orgId, refreshConversations, t],
  );

  const sidebarProps = {
    conversations,
    activeConversationId,
    loading: loadingHistory,
    onSelect: (id: string) => void openConversation(id),
    onNewChat: startNewChat,
    newChatLabel: t("dashboard.aiChat.newChat"),
    historyTitle: t("dashboard.aiChat.historyTitle"),
    emptyHistory: t("dashboard.aiChat.emptyHistory"),
    loadingLabel: t("dashboard.aiChat.loadingHistory"),
  };

  if (!orgId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-brand-primary-muted">
        {t("dashboard.aiChat.noOrganisation")}
      </div>
    );
  }

  return (
    <div className="ai-chat-root flex h-full min-h-0 w-full overflow-hidden bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-2 lg:hidden">
          <button
            type="button"
            onClick={startNewChat}
            className="text-[12px] text-brand-primary-muted"
          >
            + {t("dashboard.aiChat.newChat")}
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-md px-2 py-1 text-[12px] text-brand-primary-muted hover:bg-slate-50"
          >
            {t("dashboard.aiChat.historyTitle")}
          </button>
        </div>

        <div
          ref={scrollRef}
          className={`scrollbar-brand min-h-0 flex-1 overflow-y-auto ${isEmptyState ? "flex flex-col" : ""}`}
        >
          {loadingConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange-2" />
            </div>
          ) : isEmptyState ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6">
              <h1 className="ai-chat-greeting text-center text-[1.65rem] text-brand-primary">
                {personalizedGreeting}
              </h1>

              <div className="mt-8 w-full max-w-xl">
                <AiChatInput
                  value={input}
                  onChange={setInput}
                  onSubmit={() => void sendMessage(input)}
                  placeholder={t("dashboard.aiChat.heroPlaceholder")}
                  sendLabel={t("dashboard.aiChat.send")}
                  footerHint={t("dashboard.aiChat.footerHint")}
                  inputHint={t("dashboard.aiChat.inputHint")}
                  disabled={loadingConversation}
                  loading={loading}
                  variant="hero"
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[12px] text-brand-primary-muted transition hover:border-slate-300 hover:text-brand-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
              {messages.map((msg) => <AiChatMessageRow key={msg.id} message={msg} />)}
              {loading && <AiChatTypingRow />}
            </div>
          )}
        </div>

        {error ? (
          <p className="shrink-0 px-4 py-2 text-center text-xs text-rose-600">{error}</p>
        ) : null}

        {!isEmptyState ? (
          <div className="shrink-0 bg-gradient-to-t from-white via-white to-white/80 px-4 py-4">
            <AiChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => void sendMessage(input)}
              placeholder={t("dashboard.aiChat.placeholder")}
              sendLabel={t("dashboard.aiChat.send")}
              footerHint={t("dashboard.aiChat.footerHint")}
              inputHint={t("dashboard.aiChat.inputHint")}
              disabled={loadingConversation}
              loading={loading}
            />
          </div>
        ) : null}
      </div>

      <aside className="hidden min-h-0 w-[12.5rem] shrink-0 lg:flex lg:flex-col xl:w-[13.5rem]">
        <AiChatHistorySidebar {...sidebarProps} />
      </aside>

      {historyOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close history overlay"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(100%,14rem)] flex-col bg-white shadow-lg">
            <AiChatHistorySidebar {...sidebarProps} onClose={() => setHistoryOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
