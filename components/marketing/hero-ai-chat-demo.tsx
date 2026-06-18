"use client";

import { useEffect, useRef, useState } from "react";
import { AiRichCardView } from "@/components/dashboard/ai-chat/rich-card-view";
import type { AiRichCard } from "@/lib/types/ai-chat-api";

type RichCard = AiRichCard;

type ChatTurn = { user: string; assistant: string; card?: RichCard };

type VisibleMessage = { id: number; role: "user" | "assistant"; text: string; card?: RichCard };

const CHAT_SCRIPT: ChatTurn[] = [
  {
    user: "Aaj kitna sale hua?",
    assistant: "Aaj ka snapshot:",
    card: {
      kind: "summary",
      total: "₹12,840",
      bills: "47 bills",
      trend: "+8% vs yesterday",
      rows: [
        { label: "FMCG", value: "₹4,200" },
        { label: "Mobile accessories", value: "₹3,100" },
        { label: "Cash collected", value: "₹9,120" },
      ],
    },
  },
  {
    user: "Dhaniya kitna stock bacha hai?",
    assistant: "Dhaniya = coriander in your catalog:",
    card: { kind: "stock", name: "Coriander (dhaniya)", qty: "2.4 kg", status: "ok", hint: "Reorder at 1 kg" },
  },
  {
    user: "Rahul Traders ko Samsung A15 bill — 1 piece",
    assistant: "GST invoice ready:",
    card: {
      kind: "invoice",
      id: "INV-2026-0142",
      party: "Rahul Traders",
      total: "₹16,396",
      actions: ["WhatsApp PDF", "Print"],
    },
  },
  {
    user: "Amit Kirana ka kitna baaki?",
    assistant: "Party ledger:",
    card: { kind: "ledger", party: "Amit Kirana", amount: "₹3,450", overdue: "2 bills · 15+ days overdue" },
  },
  {
    user: "Low stock items dikhao",
    assistant: "5 SKUs need attention:",
    card: {
      kind: "list",
      title: "Low stock",
      items: ["Tata Salt 1kg (4)", "Parle-G (12)", "Colgate 100g (6)", "A15 cover (2)", "Dhaniya (2.4 kg)"],
      action: "Create purchase list",
    },
  },
];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function HeroAiChatDemo() {
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    let cancelled = false;
    const nextId = () => {
      idRef.current += 1;
      return idRef.current;
    };

    const play = async () => {
      await sleep(600);
      while (!cancelled) {
        for (const turn of CHAT_SCRIPT) {
          if (cancelled) return;
          setMessages((prev) => [...prev, { id: nextId(), role: "user", text: turn.user }]);
          await sleep(500);
          if (cancelled) return;
          setTyping(true);
          await sleep(1100);
          if (cancelled) return;
          setTyping(false);
          setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: turn.assistant, card: turn.card }]);
          await sleep(2200);
        }
        if (cancelled) return;
        await sleep(2800);
        setMessages([]);
      }
    };

    void play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_20px_50px_-24px_rgba(3,31,73,0.25)]">
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-brand-surface px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm brand-gradient-orange text-[10px] font-bold text-white">
            AI
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-primary">Mahajaan AI</p>
            <p className="text-[10px] text-brand-primary-muted">Hindi & English · simulated demo</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
        </div>

        <div ref={scrollRef} className="scrollbar-brand h-[340px] space-y-2 overflow-y-auto bg-white px-3 py-3 sm:h-[360px]">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] rounded-sm px-2.5 py-2 text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-primary text-white"
                    : "border border-slate-200 bg-brand-surface text-brand-primary"
                }`}
              >
                {msg.text}
                {msg.card && <AiRichCardView card={msg.card} />}
              </div>
            </div>
          ))}

          {typing && (
            <div className="chat-msg-in flex justify-start">
              <div className="flex gap-1 rounded-sm border border-slate-200 bg-brand-surface px-3 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-primary-muted [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-primary-muted [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-primary-muted [animation-delay:240ms]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-brand-surface/50 px-3 py-2">
          <div className="flex-1 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-brand-primary-muted">
            Ask about sales, stock, bills…
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-sm brand-gradient-orange text-white">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
