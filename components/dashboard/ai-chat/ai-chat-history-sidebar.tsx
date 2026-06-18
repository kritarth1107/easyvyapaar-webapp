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
  return (
    <div className="flex h-full flex-col border-l border-slate-200/80 bg-slate-50/50">
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-primary-muted">
          {historyTitle}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-brand-primary-muted hover:bg-slate-200/60 lg:hidden"
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

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="text-[12px] font-medium text-brand-orange-2 hover:underline"
        >
          + {newChatLabel}
        </button>
      </div>

      <div className="scrollbar-brand min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <p className="py-6 text-center text-[11px] text-brand-primary-muted">{loadingLabel}</p>
        ) : conversations.length === 0 ? (
          <p className="px-1 py-6 text-center text-[11px] text-brand-primary-muted">{emptyHistory}</p>
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const active = conversation.conversationId === activeConversationId;
              return (
                <li key={conversation.conversationId}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.conversationId)}
                    title={conversation.title}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${
                      active
                        ? "bg-white text-brand-orange-2"
                        : "text-brand-primary/80 hover:bg-white/70"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-[12px]">{conversation.title}</span>
                    <span className="shrink-0 text-[10px] text-brand-primary-muted/60">
                      {formatRelativeTime(conversation.updatedAt)}
                    </span>
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
