"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { AiChatEmptyHero } from "@/components/dashboard/ai-chat/ai-chat-empty-hero";
import { AiChatInput } from "@/components/dashboard/ai-chat/ai-chat-input";
import { AiChatHistorySidebar } from "@/components/dashboard/ai-chat/ai-chat-history-sidebar";
import { AiChatMessageRow, AiChatTypingRow } from "@/components/dashboard/ai-chat/ai-chat-message-row";
import { getPersonalizedAiGreeting } from "@/lib/ai/ai-chat-greeting";
import {
  AI_CHAT_BASE_PATH,
  aiChatConversationPath,
} from "@/lib/ai/ai-chat-routes";
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
    feedback?: "up" | "down";
    createdAt: string;
  }>,
): AiChatMessage[] {
  return rows.map((row) => ({
    id: row.messageId,
    role: row.role,
    text: row.content,
    createdAt: row.createdAt,
    ...(row.card ? { card: row.card } : {}),
    ...(row.feedback ? { feedback: row.feedback } : {}),
  }));
}

export function AiChatPage({ conversationIdFromRoute }: { conversationIdFromRoute?: string } = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, activeOrganisationId, activeOrganisation } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const routeConversationId = conversationIdFromRoute?.trim() || null;

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
  const skipRouteLoadRef = useRef<string | null>(null);

  const shopLabel = activeOrganisation?.name ?? "";
  const userName = user?.name ?? "";
  const userId = user?.userId ?? "guest";
  const userInitial = userName.trim().charAt(0) || user?.mobile?.trim().charAt(0) || "";

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
    setHistoryOpen(false);
    router.push(AI_CHAT_BASE_PATH);
  }, [router]);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!orgId) return;
      setLoadingConversation(true);
      setError(null);
      setActiveConversationId(conversationId);

      try {
        const detail = await fetchAiConversation(orgId, conversationId);
        setMessages(mapDetailToMessages(detail.messages));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.aiChat.error"));
        setMessages([]);
        setActiveConversationId(null);
        router.replace(AI_CHAT_BASE_PATH);
      } finally {
        setLoadingConversation(false);
      }
    },
    [orgId, router, t],
  );

  const openConversation = useCallback(
    (conversationId: string) => {
      if (!orgId || loadingConversation) return;
      setHistoryOpen(false);
      router.push(aiChatConversationPath(conversationId));
    },
    [loadingConversation, orgId, router],
  );

  useEffect(() => {
    if (!orgId) return;

    if (!routeConversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setInput("");
      setError(null);
      skipRouteLoadRef.current = null;
      return;
    }

    if (skipRouteLoadRef.current === routeConversationId) {
      skipRouteLoadRef.current = null;
      return;
    }

    if (routeConversationId === activeConversationId && messages.length > 0) {
      return;
    }

    void loadConversation(routeConversationId);
  }, [routeConversationId, orgId, activeConversationId, messages.length, loadConversation]);

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
            id: response.messageId,
            role: "assistant",
            text: response.reply,
            ...(response.card ? { card: response.card } : {}),
            createdAt: new Date().toISOString(),
          },
        ]);
        if (!routeConversationId) {
          skipRouteLoadRef.current = response.conversationId;
          router.replace(aiChatConversationPath(response.conversationId));
        }
        void refreshConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.aiChat.error"));
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticUser.id));
      } finally {
        setLoading(false);
      }
    },
    [activeConversationId, loading, orgId, refreshConversations, routeConversationId, router, t],
  );

  const handleFeedbackChange = useCallback((messageId: string, feedback: "up" | "down" | null) => {
    if (!feedback) return;
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg)),
    );
  }, []);

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

  const inputSharedProps = {
    value: input,
    onChange: setInput,
    onSubmit: () => void sendMessage(input),
    sendLabel: t("dashboard.aiChat.send"),
    disabled: loadingConversation,
    loading,
    quickPrompts: QUICK_PROMPTS,
    browsePromptsLabel: t("dashboard.aiChat.browsePrompts"),
  };

  if (!orgId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-brand-primary-muted">
        {t("dashboard.aiChat.noOrganisation")}
      </div>
    );
  }

  return (
    <div className="ai-chat-root flex h-full min-h-0 w-full overflow-hidden bg-[#f0f2f5]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2.5 lg:hidden">
          <p className="text-sm font-semibold text-brand-primary">{t("dashboard.aiChat.brandLabel")}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="text-[12px] font-medium text-brand-orange-2"
            >
              + {t("dashboard.aiChat.newChat")}
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="rounded-lg px-2 py-1 text-[12px] text-brand-primary-muted hover:bg-slate-50"
            >
              {t("dashboard.aiChat.historyTitle")}
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={`scrollbar-brand min-h-0 flex-1 overflow-y-auto ${isEmptyState ? "flex flex-col" : ""}`}
        >
          {loadingConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange-2" />
            </div>
          ) : isEmptyState ? (
            <>
              <AiChatEmptyHero
                greeting={personalizedGreeting}
                prompts={QUICK_PROMPTS}
                onPromptClick={(prompt) => void sendMessage(prompt)}
              />
              <div className="shrink-0 px-4 pb-6">
                <AiChatInput
                  {...inputSharedProps}
                  placeholder={t("dashboard.aiChat.heroPlaceholder")}
                  footerHint={t("dashboard.aiChat.footerHint")}
                  variant="hero"
                />
              </div>
            </>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 lg:px-6">
              {messages.map((msg) => (
                <AiChatMessageRow
                  key={msg.id}
                  message={msg}
                  organisationId={orgId}
                  userInitial={userInitial}
                  onFeedbackChange={handleFeedbackChange}
                />
              ))}
              {loading ? <AiChatTypingRow /> : null}
            </div>
          )}
        </div>

        {error ? (
          <p className="shrink-0 px-4 py-2 text-center text-xs text-rose-600">{error}</p>
        ) : null}

        {!isEmptyState ? (
          <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3">
            <AiChatInput
              {...inputSharedProps}
              placeholder={t("dashboard.aiChat.placeholder")}
              footerHint={t("dashboard.aiChat.footerHint")}
            />
          </div>
        ) : null}
      </div>

      <aside className="hidden min-h-0 w-[15rem] shrink-0 xl:w-[17rem] lg:flex lg:flex-col">
        <AiChatHistorySidebar {...sidebarProps} />
      </aside>

      {historyOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close history overlay"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(100%,17rem)] flex-col bg-white shadow-2xl">
            <AiChatHistorySidebar {...sidebarProps} onClose={() => setHistoryOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
