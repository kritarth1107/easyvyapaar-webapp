"use client";

import { AiRichCardView } from "@/components/dashboard/ai-chat/rich-card-view";
import { AiChatMessageActions } from "@/components/dashboard/ai-chat/ai-chat-message-actions";
import { AiAssistantAvatar, UserAvatar } from "@/components/dashboard/ai-chat/ai-chat-avatars";
import type { AiChatMessage } from "@/lib/types/ai-chat-api";

function formatMessageBody(text: string) {
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={`br-${index}`} />;
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      return (
        <p key={`${index}-${trimmed}`} className="text-[14px] leading-relaxed text-brand-primary/90">
          {trimmed}
        </p>
      );
    }
    return (
      <p
        key={`${index}-${trimmed}`}
        className={
          index === 0
            ? "text-[15px] font-medium leading-relaxed text-brand-primary"
            : "text-[14px] leading-relaxed text-brand-primary/90"
        }
      >
        {line}
      </p>
    );
  });
}

type AiChatMessageRowProps = {
  message: AiChatMessage;
  organisationId: string;
  userInitial?: string;
  onFeedbackChange?: (messageId: string, feedback: "up" | "down" | null) => void;
};

export function AiChatMessageRow({
  message,
  organisationId,
  userInitial,
  onFeedbackChange,
}: AiChatMessageRowProps) {
  const isUser = message.role === "user";
  const hasText = message.text.trim().length > 0;
  const copyText = message.text.trim();

  if (isUser) {
    return (
      <div className="chat-msg-in flex gap-3">
        <UserAvatar size="sm" initial={userInitial} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-brand-primary">
              {message.text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-msg-in flex gap-3">
      <AiAssistantAvatar size="sm" />
      <div className="min-w-0 flex-1">
        <div className="ai-chat-response-panel rounded-2xl border border-slate-200/60 px-4 py-4 shadow-sm">
          {hasText ? <div className="space-y-1">{formatMessageBody(message.text)}</div> : null}
          {message.card ? (
            <div className={hasText ? "mt-4 border-t border-slate-200/50 pt-4" : ""}>
              <AiRichCardView card={message.card} />
            </div>
          ) : null}
          {copyText ? (
            <AiChatMessageActions
              text={copyText}
              messageId={message.id}
              organisationId={organisationId}
              initialFeedback={message.feedback ?? null}
              onFeedbackChange={(feedback) => onFeedbackChange?.(message.id, feedback)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AiChatTypingRow() {
  return (
    <div className="chat-msg-in flex gap-3">
      <AiAssistantAvatar size="sm" />
      <div className="ai-chat-response-panel flex items-center gap-2 rounded-2xl border border-slate-200/60 px-4 py-4 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-orange-2/80 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-orange-2/80 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-orange-2/80 [animation-delay:240ms]" />
      </div>
    </div>
  );
}
