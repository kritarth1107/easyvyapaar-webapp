"use client";

import { useEffect, useRef, useState } from "react";
import { AI_FEATURES_CUSTOMER } from "@/lib/marketing/site-content";

const SHOP = {
  name: "Sharma Kirana Store",
  area: "Sector 12, Raipur",
  upi: "sharma.kirana@okicici",
};

type PhaseId = "order" | "pay" | "bill" | "ask" | "review" | "reminder";

type ScriptStep = {
  phase: PhaseId;
  role: "customer" | "shop";
  delayAfter?: number;
} & (
  | { type: "text"; text: string }
  | { type: "order"; items: { name: string; qty: string; price: string }[]; total: string; eta: string }
  | { type: "upi"; amount: string; upiId: string }
  | { type: "pdf"; invoiceId: string; amount: string; date: string }
  | { type: "rating"; prompt: string }
  | { type: "reminder"; party: string; amount: string; days: string }
);

const SCRIPT: ScriptStep[] = [
  {
    phase: "order",
    role: "customer",
    type: "text",
    text: "Namaste Sharma ji 🙏 Ghar pe atta khatam ho gaya. 2kg Tata Gold aur 1 Surf Excel 1kg bhej doge?",
  },
  {
    phase: "order",
    role: "shop",
    type: "order",
    items: [
      { name: "Tata Gold atta", qty: "2 kg", price: "₹112" },
      { name: "Surf Excel 1kg", qty: "1 pc", price: "₹289" },
    ],
    total: "₹401",
    eta: "Aaj shaam 6–7 baje delivery",
    delayAfter: 2200,
  },
  { phase: "order", role: "customer", type: "text", text: "Haan theek hai, bhej do" },
  {
    phase: "pay",
    role: "shop",
    type: "upi",
    amount: "₹401",
    upiId: SHOP.upi,
    delayAfter: 2400,
  },
  { phase: "pay", role: "customer", type: "text", text: "Payment kar diya ✅" },
  {
    phase: "pay",
    role: "shop",
    type: "text",
    text: "Payment received ✓ Order ORD-2847 confirm. Ramesh bhai aapke ghar deliver karenge.",
    delayAfter: 2000,
  },
  {
    phase: "bill",
    role: "shop",
    type: "pdf",
    invoiceId: "INV-2026-0188",
    amount: "₹401",
    date: "4 Jun 2026",
    delayAfter: 2200,
  },
  {
    phase: "ask",
    role: "customer",
    type: "text",
    text: "Kal wala bill dubara bhej dena — CA ko dena hai",
  },
  {
    phase: "ask",
    role: "shop",
    type: "text",
    text: "Bhej diya Priya ji — same INV-2026-0188 PDF. Kuch aur chahiye?",
    delayAfter: 2000,
  },
  {
    phase: "review",
    role: "shop",
    type: "rating",
    prompt: "Delivery kaisi rahi? 1–5 star batayein 🙏",
    delayAfter: 2200,
  },
  { phase: "review", role: "customer", type: "text", text: "⭐⭐⭐⭐⭐ Time pe aa gaya, sab sahi tha" },
  {
    phase: "review",
    role: "shop",
    type: "text",
    text: "Dhanyavaad Priya ji! Agli order pe 2% off coupon — SAVE2",
    delayAfter: 2800,
  },
  {
    phase: "reminder",
    role: "shop",
    type: "reminder",
    party: "Amit Verma",
    amount: "₹850",
    days: "12 din",
    delayAfter: 2600,
  },
];

const PHASE_LABELS: Record<PhaseId, string> = {
  order: "Place order",
  pay: "Pay on WhatsApp",
  bill: "GST bill PDF",
  ask: "Ask & resend bill",
  review: "Review & rating",
  reminder: "Auto payment reminder",
};

const PHASE_TO_FEATURE: Record<PhaseId, number> = {
  order: 0,
  pay: 1,
  ask: 2,
  bill: 3,
  reminder: 4,
  review: 5,
};

type VisibleStep = ScriptStep & { id: number };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function OrderCard({ step }: { step: Extract<ScriptStep, { type: "order" }> }) {
  return (
    <div className="mt-1.5 rounded-sm border border-slate-200 bg-white p-2.5 text-[11px]">
      <p className="font-bold text-brand-primary">Order summary</p>
      <ul className="mt-1.5 space-y-1">
        {step.items.map((item) => (
          <li key={item.name} className="flex justify-between gap-2 text-brand-primary">
            <span>
              {item.name} · {item.qty}
            </span>
            <span className="font-semibold tabular-nums">{item.price}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-slate-100 pt-1.5 font-bold">
        <span>Total</span>
        <span className="text-brand-orange-2">{step.total}</span>
      </div>
      <p className="mt-1 text-[10px] text-brand-primary-muted">🛵 {step.eta}</p>
    </div>
  );
}

function UpiCard({ step }: { step: Extract<ScriptStep, { type: "upi" }> }) {
  return (
    <div className="mt-1.5 rounded-sm border border-emerald-200 bg-emerald-50 p-2.5 text-[11px]">
      <p className="font-bold text-emerald-900">Pay via UPI</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{step.amount}</p>
      <p className="mt-1 font-mono text-[10px] text-emerald-800">{step.upiId}</p>
      <p className="mt-2 rounded-sm bg-emerald-600 py-1.5 text-center text-[10px] font-bold text-white">
        Tap to pay · UPI
      </p>
    </div>
  );
}

function PdfCard({ step }: { step: Extract<ScriptStep, { type: "pdf" }> }) {
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-sm border border-slate-200 bg-white p-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-red-50 text-[10px] font-bold text-red-600">
        PDF
      </div>
      <div className="min-w-0 text-[11px]">
        <p className="truncate font-bold text-brand-primary">{step.invoiceId}.pdf</p>
        <p className="text-brand-primary-muted">
          {step.amount} · GST · {step.date}
        </p>
      </div>
    </div>
  );
}

function ReminderCard({ step }: { step: Extract<ScriptStep, { type: "reminder" }> }) {
  return (
    <div className="mt-1.5 rounded-sm border border-amber-200 bg-amber-50 p-2.5 text-[11px]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Auto reminder sent</p>
      <p className="mt-1 font-bold text-brand-primary">{step.party}</p>
      <p className="text-base font-bold tabular-nums text-amber-700">{step.amount} outstanding</p>
      <p className="text-[10px] text-amber-800/80">{step.days} se pending · UPI link attached</p>
    </div>
  );
}

function MessageBubble({ step }: { step: VisibleStep }) {
  const isCustomer = step.role === "customer";

  return (
    <div className={`chat-msg-in flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-sm px-2.5 py-2 text-[12px] leading-relaxed shadow-sm ${
          isCustomer ? "bg-[#dcf8c6] text-slate-800" : "border border-slate-200/80 bg-white text-brand-primary"
        }`}
      >
        {step.type === "text" && <p>{step.text}</p>}
        {step.type === "order" && (
          <>
            <p>Confirm kijiye Priya ji:</p>
            <OrderCard step={step} />
          </>
        )}
        {step.type === "upi" && (
          <>
            <p>Pay kijiye — payment milte hi order dispatch:</p>
            <UpiCard step={step} />
          </>
        )}
        {step.type === "pdf" && (
          <>
            <p>Aapka GST bill:</p>
            <PdfCard step={step} />
          </>
        )}
        {step.type === "rating" && <p>{step.prompt}</p>}
        {step.type === "reminder" && (
          <>
            <p className="text-[10px] text-brand-primary-muted">System ne due date pe bheja:</p>
            <ReminderCard step={step} />
          </>
        )}
        <p className={`mt-1 text-right text-[9px] ${isCustomer ? "text-emerald-800/50" : "text-slate-400"}`}>
          {isCustomer ? "Priya Sharma" : SHOP.name} · now
        </p>
      </div>
    </div>
  );
}

export function CustomerWhatsappAutoplay() {
  const [messages, setMessages] = useState<VisibleStep[]>([]);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState<PhaseId>("order");
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
      await sleep(700);
      while (!cancelled) {
        for (const step of SCRIPT) {
          if (cancelled) return;
          setPhase(step.phase);

          if (step.role === "shop") {
            setTyping(true);
            await sleep(1100);
            if (cancelled) return;
            setTyping(false);
          }

          setMessages((prev) => [...prev, { ...step, id: nextId() }]);
          await sleep(step.delayAfter ?? (step.role === "customer" ? 900 : 1800));
        }

        if (cancelled) return;
        await sleep(3200);
        setMessages([]);
        setPhase("order");
      }
    };

    void play();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFeature = PHASE_TO_FEATURE[phase];

  return (
    <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-[#e5ddd5] shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-200/80 bg-[#075e54] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/20 text-xs font-bold text-white">
          SK
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{SHOP.name}</p>
          <p className="truncate text-[10px] text-emerald-100/90">{SHOP.area} · Business · Live demo</p>
        </div>
        <span className="rounded-sm bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase text-white/90">
          {PHASE_LABELS[phase]}
        </span>
      </div>

      <div ref={scrollRef} className="scrollbar-brand h-[420px] space-y-2 overflow-y-auto px-3 py-3 sm:h-[460px]">
        <div className="mx-auto max-w-[95%] rounded-sm bg-[#fff9c4] px-2.5 py-1.5 text-center text-[9px] font-medium text-amber-900/85">
          Real flow — Priya Sharma orders, pays, gets bill, rates delivery. Shop auto-reminds Amit for udhar.
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} step={msg} />
        ))}

        {typing && (
          <div className="chat-msg-in flex justify-start">
            <div className="flex gap-1 rounded-sm border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366] [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366] [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200/60 bg-white/90 px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {AI_FEATURES_CUSTOMER.map((item, i) => (
            <span
              key={item.title}
              className={`rounded-sm px-2 py-0.5 text-[9px] font-semibold transition-all duration-300 ${
                i === activeFeature
                  ? "bg-[#25D366] text-white"
                  : "bg-brand-surface text-brand-primary-muted"
              }`}
            >
              {item.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
