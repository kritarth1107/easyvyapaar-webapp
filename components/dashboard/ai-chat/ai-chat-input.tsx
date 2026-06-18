"use client";

import { useCallback, useEffect, useRef } from "react";

type AiChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  sendLabel: string;
  footerHint: string;
  inputHint: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "hero";
};

const MAX_TEXTAREA_HEIGHT = 180;

export function AiChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  sendLabel,
  disabled = false,
  loading = false,
  variant = "default",
}: AiChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && !loading && value.trim().length > 0;
  const isHero = variant === "hero";

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto w-full ${isHero ? "max-w-2xl" : "max-w-2xl"}`}
    >
      <div
        className={`ai-chat-composer relative flex flex-col rounded-[1.35rem] border bg-white transition ${
          isHero
            ? "border-slate-200/90 px-4 py-3.5 shadow-md ring-1 ring-slate-900/[0.04] focus-within:border-slate-300 focus-within:shadow-lg"
            : "border-slate-200/80 px-4 py-3 shadow-sm focus-within:border-slate-300"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={isHero ? 2 : 1}
          className={`max-h-[180px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-brand-primary outline-none placeholder:text-brand-primary-muted/45 disabled:opacity-60 ${
            isHero ? "min-h-[48px]" : "min-h-[28px]"
          }`}
          aria-label={placeholder}
        />
        <div className="mt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={!canSend}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              canSend
                ? "bg-brand-primary text-white hover:opacity-90 active:scale-95"
                : "bg-slate-100 text-slate-300"
            }`}
            aria-label={sendLabel}
          >
            {loading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M10.293 2.293a1 1 0 011.414 0l6 6a.75.75 0 01-1.06 1.06L11 5.414V16.5a.75.75 0 01-1.5 0V5.414L4.757 9.353a.75.75 0 01-1.06-1.06l6-6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
