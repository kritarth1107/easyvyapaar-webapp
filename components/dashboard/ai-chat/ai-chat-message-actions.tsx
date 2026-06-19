"use client";

import { useState } from "react";
import { submitAiMessageFeedback } from "@/lib/ai/ai-chat-api-client";
import { useTranslation } from "@/lib/localization";

type Feedback = "up" | "down" | null;

type AiChatMessageActionsProps = {
  text: string;
  messageId: string;
  organisationId: string;
  initialFeedback?: Feedback;
  onFeedbackChange?: (feedback: Feedback) => void;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function isPersistedMessageId(messageId: string): boolean {
  return messageId.length > 0 && !messageId.startsWith("local-") && !messageId.startsWith("assistant-");
}

export function AiChatMessageActions({
  text,
  messageId,
  organisationId,
  initialFeedback = null,
  onFeedbackChange,
}: AiChatMessageActionsProps) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<Feedback>(initialFeedback);
  const [copied, setCopied] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);

  const canPersistFeedback = isPersistedMessageId(messageId) && organisationId.trim().length > 0;

  const handleFeedback = async (value: "up" | "down") => {
    if (feedback === value) return;

    if (!canPersistFeedback) {
      setFeedback(value);
      onFeedbackChange?.(value);
      return;
    }

    setSavingFeedback(true);
    try {
      await submitAiMessageFeedback(organisationId, messageId, value);
      setFeedback(value);
      onFeedbackChange?.(value);
    } catch {
      // keep prior state on failure
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: t("dashboard.aiChat.brandLabel"),
      text: text.slice(0, 2000),
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // cancelled or failed
      }
    }
    await handleCopy();
  };

  const thumbBase =
    "flex h-8 w-8 items-center justify-center rounded-lg text-brand-primary-muted transition hover:bg-white hover:text-brand-primary disabled:opacity-40";

  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/50 pt-2.5">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={savingFeedback}
          onClick={() => void handleFeedback("up")}
          className={`${thumbBase} ${feedback === "up" ? "bg-white text-brand-orange-2 shadow-sm" : ""}`}
          aria-label={t("dashboard.aiChat.feedbackHelpful")}
          aria-pressed={feedback === "up"}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          disabled={savingFeedback}
          onClick={() => void handleFeedback("down")}
          className={`${thumbBase} ${feedback === "down" ? "bg-white text-brand-primary shadow-sm" : ""}`}
          aria-label={t("dashboard.aiChat.feedbackNotHelpful")}
          aria-pressed={feedback === "down"}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-brand-primary-muted transition hover:bg-white hover:text-brand-primary"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v8A1.5 1.5 0 004.5 17h8a1.5 1.5 0 001.5-1.5v-1h-3.379a3 3 0 01-2.121-.879L4.939 9.378A3 3 0 014.5 8.257V6z" />
          </svg>
          {copied ? t("dashboard.aiChat.copied") : t("dashboard.aiChat.copy")}
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-brand-primary-muted transition hover:bg-white hover:text-brand-primary"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          {t("dashboard.aiChat.share")}
        </button>
      </div>
    </div>
  );
}
