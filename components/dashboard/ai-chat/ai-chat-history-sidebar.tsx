"use client";

import type { AiConversationSummary } from "@/lib/types/ai-chat-api";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

type AiChatHistorySidebarProps = {
  conversations: AiConversationSummary[];
  activeConversationId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
  newChatLabel: string;
  historyTitle: string;
  emptyHistory: string;
  loadingLabel: string;
};

export function AiChatHistorySidebar({
  conversations,
  activeConversationId,
  loading,
  onSelect,
  onNewChat,
  onClose,
  newChatLabel,
  historyTitle,
  emptyHistory,
  loadingLabel,
}: AiChatHistorySidebarProps) {
  const countLabel = `${historyTitle} (${conversations.length})`;

  return (
    <div className="flex h-full flex-col border-l border-slate-200/80 bg-[#f7f8fa]">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <p className="text-sm font-semibold text-brand-primary">{countLabel}</p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-primary-muted hover:bg-white lg:hidden"
            aria-label="Close history"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-brand-primary shadow-sm transition hover:border-brand-orange-2/30 hover:text-brand-orange-2"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          {newChatLabel}
        </button>
      </div>

      <div className="scrollbar-brand min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <p className="py-8 text-center text-[12px] text-brand-primary-muted">{loadingLabel}</p>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center">
            <p className="text-[12px] leading-relaxed text-brand-primary-muted">{emptyHistory}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => {
              const active = conversation.conversationId === activeConversationId;
              return (
                <li key={conversation.conversationId}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.conversationId)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-brand-orange-2/30 bg-white shadow-sm ring-1 ring-brand-orange-2/15"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`line-clamp-1 text-[13px] font-semibold leading-snug ${
                          active ? "text-brand-orange-2" : "text-brand-primary"
                        }`}
                      >
                        {conversation.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-brand-primary-muted">
                        {formatRelativeTime(conversation.updatedAt)}
                      </span>
                    </div>
                    {conversation.lastMessagePreview ? (
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-brand-primary-muted">
                        {conversation.lastMessagePreview}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
