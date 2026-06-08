"use client";

import { useEffect, useState } from "react";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { ALL_FEATURES } from "@/lib/marketing/site-content";

function resolveTabFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return null;
  if (ALL_FEATURES.some((group) => group.id === id)) return id;
  if (id === "pos") return "operations";
  return null;
}

export function FeaturesModuleTabs() {
  const [activeId, setActiveId] = useState(ALL_FEATURES[0].id);
  const active = ALL_FEATURES.find((group) => group.id === activeId) ?? ALL_FEATURES[0];

  useEffect(() => {
    const syncFromHash = () => {
      const tabId = resolveTabFromHash(window.location.hash);
      if (tabId) setActiveId(tabId);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">Full module list</p>
          <h2 className="mt-2 text-3xl font-bold text-brand-primary">Every feature, grouped by how you work</h2>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200/90 bg-brand-surface/80 p-1.5 sm:min-w-0 sm:flex sm:flex-wrap sm:justify-center">
            {ALL_FEATURES.map((group) => {
              const isActive = group.id === activeId;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveId(group.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? "brand-gradient-orange-h text-white shadow-md shadow-brand-orange-1/25"
                      : "text-brand-primary/80 hover:bg-white hover:text-brand-primary"
                  }`}
                >
                  <FeatureIcon type={group.icon} className="h-4 w-4" />
                  <span>{group.category}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-white text-brand-primary-muted"
                    }`}
                  >
                    {group.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div id={active.id} className="mt-8 scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-brand-surface/40 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white">
                  <FeatureIcon type={active.icon} className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-brand-primary">{active.category}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-primary-muted">{active.summary}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-brand-primary-muted">{active.items.length} features in this module</p>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            {active.items.map((item) => (
              <article
                key={item.title}
                id={item.title.toLowerCase().includes("pos") ? "pos" : undefined}
                className="rounded-2xl border border-slate-200/80 bg-brand-surface/30 p-5 transition hover:border-brand-orange-1/30 hover:bg-white hover:shadow-md"
              >
                <h4 className="text-lg font-bold text-brand-primary">{item.title}</h4>
                <p className="mt-2 text-sm leading-7 text-brand-primary-muted">{item.description}</p>
                <ul className="mt-4 space-y-2 border-t border-slate-200/80 pt-4">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 text-sm text-brand-primary">
                      <span className="font-bold text-brand-orange-2">✓</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
