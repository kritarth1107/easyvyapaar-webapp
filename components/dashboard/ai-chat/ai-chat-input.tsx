"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_CHARS = 3000;

type AiChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  sendLabel: string;
  footerHint?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "hero";
  quickPrompts?: string[];
  browsePromptsLabel?: string;
};

const MAX_TEXTAREA_HEIGHT = 160;

export function AiChatInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  sendLabel,
  footerHint,
  disabled = false,
  loading = false,
  variant = "default",
  quickPrompts = [],
  browsePromptsLabel = "Browse prompts",
}: AiChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [promptsOpen, setPromptsOpen] = useState(false);
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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div
        className={`flex flex-col rounded-2xl border bg-white transition focus-within:border-slate-300 focus-within:shadow-md ${
          isHero
            ? "border-slate-200 shadow-md ring-1 ring-slate-900/[0.04]"
            : "border-slate-200/90 shadow-sm"
        }`}
      >
        <div className="flex items-end gap-2 px-3 pt-3 sm:px-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            rows={isHero ? 2 : 1}
            className={`max-h-[160px] min-w-0 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-brand-primary outline-none placeholder:text-brand-primary-muted/50 disabled:opacity-60 ${
              isHero ? "min-h-[52px]" : "min-h-[40px] py-1"
            }`}
            aria-label={placeholder}
          />
          <button
            type="submit"
            disabled={!canSend}
            className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
              canSend
                ? "brand-gradient-orange text-white shadow-md shadow-orange-500/25 hover:brightness-105 active:scale-95"
                : "bg-slate-100 text-slate-300"
            }`}
            aria-label={sendLabel}
          >
            {loading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 sm:px-4">
          {quickPrompts.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPromptsOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-brand-primary-muted hover:bg-slate-50 hover:text-brand-primary"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2h-8a2 2 0 01-2-2V4z" />
                </svg>
                {browsePromptsLabel}
              </button>
              {promptsOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Close prompts"
                    onClick={() => setPromptsOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-[min(100vw-2rem,16rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          onChange(prompt);
                          setPromptsOpen(false);
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-[12px] text-brand-primary hover:bg-slate-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          <span className="text-[10px] tabular-nums text-brand-primary-muted/55">
            {value.length} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {footerHint && isHero ? (
        <p className="mt-3 text-center text-[11px] text-brand-primary-muted/65">{footerHint}</p>
      ) : null}
    </form>
  );
}
