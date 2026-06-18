"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  GLOBAL_SEARCH_CATEGORY_ORDER,
  runGlobalSearch,
} from "@/lib/dashboard/global-search";
import type { GlobalSearchCategory, GlobalSearchResult } from "@/lib/dashboard/global-search-types";
import { useDashboardNav } from "@/lib/dashboard/use-dashboard-nav";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";

type GlobalSearchDialogProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
};

const CATEGORY_LABEL_KEYS: Record<GlobalSearchCategory, TranslationKey> = {
  pages: "dashboard.globalSearch.categoryPages",
  parties: "dashboard.globalSearch.categoryParties",
  items: "dashboard.globalSearch.categoryItems",
  serials: "dashboard.globalSearch.categorySerials",
  salesInvoices: "dashboard.globalSearch.categorySalesInvoices",
  purchaseBills: "dashboard.globalSearch.categoryPurchaseBills",
  purchaseOrders: "dashboard.globalSearch.categoryPurchaseOrders",
  purchaseReturns: "dashboard.globalSearch.categoryPurchaseReturns",
  quotations: "dashboard.globalSearch.categoryQuotations",
  deliveryChallans: "dashboard.globalSearch.categoryDeliveryChallans",
  creditNotes: "dashboard.globalSearch.categoryCreditNotes",
  salesReturns: "dashboard.globalSearch.categorySalesReturns",
  expenses: "dashboard.globalSearch.categoryExpenses",
  payments: "dashboard.globalSearch.categoryPayments",
  staff: "dashboard.globalSearch.categoryStaff",
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GlobalSearchDialog({ open, onClose, initialQuery = "" }: GlobalSearchDialogProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const { flattenLinks } = useDashboardNav();
  const orgId = activeOrganisationId?.trim() ?? "";

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navLinksRef = useRef(flattenLinks);
  navLinksRef.current = flattenLinks;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setResults([]);
    setLoading(false);
    setHighlightIndex(0);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    if (!orgId) {
      setResults([]);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void runGlobalSearch(orgId, trimmed, navLinksRef.current)
        .then((items) => {
          if (!cancelled) {
            setResults(items);
            setHighlightIndex(0);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, orgId, query]);

  const grouped = useMemo(() => {
    const map = new Map<GlobalSearchCategory, GlobalSearchResult[]>();
    for (const result of results) {
      const list = map.get(result.category) ?? [];
      list.push(result);
      map.set(result.category, list);
    }
    return GLOBAL_SEARCH_CATEGORY_ORDER
      .filter((category) => map.has(category))
      .map((category) => ({ category, items: map.get(category)! }));
  }, [results]);

  const flatResults = useMemo(() => grouped.flatMap((group) => group.items), [grouped]);

  const navigateTo = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % flatResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = flatResults[highlightIndex];
      if (target) navigateTo(target.href);
    }
  };

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, flatResults]);

  if (!mounted || !open) return null;

  let resultIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-start justify-center bg-brand-primary/40 p-4 pt-[12vh] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={t("dashboard.globalSearch.title")}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <SearchIcon className="h-5 w-5 shrink-0 text-brand-primary-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("dashboard.globalSearch.placeholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-brand-primary outline-none placeholder:text-brand-primary-muted/70"
            aria-label={t("dashboard.globalSearch.placeholder")}
          />
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-primary-muted sm:inline">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[min(60vh,520px)] overflow-y-auto p-2">
          {!orgId ? (
            <p className="px-3 py-8 text-center text-sm text-brand-primary-muted">
              {t("dashboard.globalSearch.noOrganisation")}
            </p>
          ) : query.trim().length < 1 ? (
            <p className="px-3 py-8 text-center text-sm text-brand-primary-muted">
              {t("dashboard.globalSearch.typeToSearch")}
            </p>
          ) : loading ? (
            <p className="px-3 py-8 text-center text-sm text-brand-primary-muted">
              {t("common.pleaseWait")}
            </p>
          ) : flatResults.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-brand-primary-muted">
              {t("dashboard.globalSearch.noResults")}
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.category} className="mb-2 last:mb-0">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
                  {t(CATEGORY_LABEL_KEYS[group.category])}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((result) => {
                    const index = resultIndex;
                    resultIndex += 1;
                    const active = index === highlightIndex;
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          data-active={active ? "true" : "false"}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                            active ? "bg-brand-primary/8 ring-1 ring-brand-primary/15" : "hover:bg-slate-50"
                          }`}
                          onClick={() => navigateTo(result.href)}
                          onMouseEnter={() => setHighlightIndex(index)}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              active ? "bg-brand-primary text-white" : "bg-brand-surface text-brand-primary"
                            }`}
                          >
                            <NavIcon id={result.iconId} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-brand-primary">
                              {result.title}
                            </span>
                            {result.subtitle ? (
                              <span className="block truncate text-xs text-brand-primary-muted">
                                {result.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {flatResults.length > 0 ? (
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-brand-primary-muted">
            <span className="hidden sm:inline">{t("dashboard.globalSearch.hintNavigate")}</span>
            <span className="sm:hidden">{t("dashboard.globalSearch.hintTap")}</span>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
