"use client";

import Image from "next/image";
import { BRAND_ICON } from "@/lib/brand/assets";
import { useTranslation } from "@/lib/localization";

const PROMPT_ICONS = ["₹", "📦", "👥", "📊"] as const;

type AiChatEmptyHeroProps = {
  greeting: string;
  onPromptClick: (prompt: string) => void;
  prompts: string[];
};

export function AiChatEmptyHero({ greeting, onPromptClick, prompts }: AiChatEmptyHeroProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-8">
      <div className="ai-chat-hero-glow pointer-events-none absolute inset-x-0 top-8 mx-auto h-48 w-[min(100%,28rem)] rounded-full" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="ai-chat-orb mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-orange-500/15 ring-1 ring-slate-200/80">
          <Image
            src={BRAND_ICON}
            alt="Mahajaan"
            width={48}
            height={48}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-orange-2/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-orange-2 shadow-sm">
          {t("dashboard.aiChat.brandLabel")}
        </span>

        <h1 className="ai-chat-greeting max-w-lg text-[1.75rem] leading-tight text-brand-primary sm:text-[2rem]">
          {greeting}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-primary-muted">
          {t("dashboard.aiChat.heroSubtitle")}
        </p>
      </div>

      <div className="relative z-10 mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {prompts.map((prompt, index) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptClick(prompt)}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3.5 text-left shadow-sm transition hover:border-brand-orange-2/35 hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/[0.06] text-sm font-semibold text-brand-orange-2">
              {PROMPT_ICONS[index % PROMPT_ICONS.length]}
            </span>
            <span className="text-[13px] font-medium leading-snug text-brand-primary group-hover:text-brand-orange-2">
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
