"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { HsnCatalogEntry } from "@/lib/inventory/hsn-catalog";
import { useTranslation } from "@/lib/localization";

type HsnPickerDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  initialQuery?: string;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HsnPickerDrawer({ open, onClose, onSelect, initialQuery = "" }: HsnPickerDrawerProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<HsnCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setResults([]);
    setError(null);
  }, [open, initialQuery]);

  const runSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/hsn?q=${encodeURIComponent(q)}&limit=60`);
      const body = (await res.json()) as { data?: HsnCatalogEntry[]; error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to search HSN codes");
      }
      setResults(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Failed to search HSN codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [open, query, runSearch]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, onClose]);

  const handleSelect = (e: React.MouseEvent, entry: HsnCatalogEntry) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(entry.code);
    window.setTimeout(() => onClose(), 0);
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-brand-primary/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          window.setTimeout(() => onClose(), 0);
        }}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200/90 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hsn-picker-title"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="hsn-picker-title" className="text-lg font-bold text-brand-primary">
              {t("dashboard.inventory.createItem.hsnPicker.title")}
            </h2>
            <p className="mt-0.5 text-sm text-brand-primary-muted">
              {t("dashboard.inventory.createItem.hsnPicker.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.inventory.createItem.hsnPicker.searchPlaceholder")}
            autoFocus
            className="h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
          />
          <p className="mt-2 text-[11px] text-brand-primary-muted">
            {t("dashboard.inventory.createItem.hsnPicker.searchHint")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-brand">
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-orange-1" />
              <p className="mt-3 text-sm text-brand-primary-muted">
                {t("dashboard.inventory.createItem.hsnPicker.searching")}
              </p>
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm font-medium text-red-600">{error}</p>
          ) : query.trim().length < 2 ? (
            <p className="px-5 py-12 text-center text-sm text-brand-primary-muted">
              {t("dashboard.inventory.createItem.hsnPicker.typeToSearch")}
            </p>
          ) : results.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-brand-primary-muted">
              {t("dashboard.inventory.createItem.hsnPicker.noResults")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((entry) => (
                <li key={entry.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleSelect(e, entry)}
                    className="w-full px-5 py-3 text-left transition-colors hover:bg-brand-orange-1/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="shrink-0 rounded-md bg-brand-primary/[0.06] px-2 py-0.5 font-mono text-xs font-bold text-brand-primary">
                        {entry.code}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-brand-primary-muted">
                        {entry.chapter}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-brand-primary-mid">
                      {entry.description}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {results.length > 0 && (
          <div className="border-t border-slate-100 bg-brand-surface/40 px-5 py-3 text-center text-[11px] text-brand-primary-muted">
            {results.length} {t("dashboard.inventory.createItem.hsnPicker.resultsShown")}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
