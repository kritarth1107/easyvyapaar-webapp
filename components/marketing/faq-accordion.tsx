"use client";

import { useState } from "react";

export function FaqAccordion({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-200/90 rounded-2xl border border-slate-200/90 bg-white">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-brand-primary sm:text-base">{item.question}</span>
              <span className="mt-0.5 shrink-0 text-brand-orange-2">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <p className="px-5 pb-5 text-sm leading-7 text-brand-primary-muted">{item.answer}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
