"use client";

import { AiRichCardView } from "@/components/dashboard/ai-chat/rich-card-view";
import { AiSparkleIcon } from "@/components/dashboard/ai-chat/ai-chat-avatars";
import type { AiChatMessage } from "@/lib/types/ai-chat-api";

export function AiChatMessageRow({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="chat-msg-in flex w-full justify-end">
        <div className="max-w-[82%] rounded-[1.25rem] rounded-br-md bg-brand-primary px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-msg-in flex w-full gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-gradient-orange text-white shadow-sm">
        <AiSparkleIcon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 max-w-[88%] flex-1">
        {message.text.trim() ? (
          <div className="rounded-[1.25rem] rounded-tl-md border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-[14px] leading-relaxed text-brand-primary shadow-sm">
            <div className="space-y-1.5 whitespace-pre-wrap break-words">
              {message.text.split("\n").map((line, index) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
                  return (
                    <p key={`${index}-${trimmed}`} className="text-[13px] text-brand-primary/90">
                      {trimmed}
                    </p>
                  );
                }
                return (
                  <p
                    key={`${index}-${trimmed}`}
                    className={index === 0 ? "font-medium text-brand-primary" : "text-brand-primary/90"}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        ) : null}
        {message.card ? (
          <div className={message.text.trim() ? "mt-3" : ""}>
            <AiRichCardView card={message.card} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AiChatTypingRow() {
  return (
    <div className="chat-msg-in flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-gradient-orange text-white opacity-80">
        <AiSparkleIcon className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-[1.25rem] rounded-tl-md border border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-orange-2/70 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-orange-2/70 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-orange-2/70 [animation-delay:240ms]" />
      </div>
    </div>
  );
}
