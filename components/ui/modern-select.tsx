"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ModernSelectOption = {
  value: string;
  label: string;
};

type ModernSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ModernSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact";
  /** When compact: true = left-border segment (attached to input); false = standalone bordered control */
  compactAttached?: boolean;
  alignMenu?: "start" | "end";
  footer?: React.ReactNode;
  "aria-label"?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={`h-4 w-4 shrink-0 text-brand-primary-muted transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-brand-primary-muted" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.35" />
      <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-brand-orange-2" aria-hidden>
      <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ModernSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchable = false,
  searchPlaceholder = "Search…",
  emptyMessage = "No options found",
  disabled = false,
  className = "",
  variant = "default",
  compactAttached = true,
  alignMenu = "start",
  footer,
  "aria-label": ariaLabel,
}: ModernSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const isCompact = variant === "compact";
  const menuId = useMemo(
    () => `ms-${options.map((o) => o.value).join("-").slice(0, 24)}`,
    [options]
  );

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, search, searchable]);

  useEffect(() => setMounted(true), []);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = isCompact ? Math.max(rect.width, 140) : rect.width;
    const margin = 8;
    const maxMenuHeight = 240;

    let left = alignMenu === "end" ? rect.right - menuWidth : rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(maxMenuHeight, openUp ? spaceAbove - 4 : spaceBelow - 4);
    const top = openUp ? rect.top - maxHeight - 4 : rect.bottom + 4;

    setMenuStyle({ top, left, width: menuWidth, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, alignMenu, isCompact]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(`modern-select-menu-${menuId}`);
      if (menu?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, menuId]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  const triggerClass = isCompact
    ? compactAttached
      ? `flex h-full min-h-9 min-w-[72px] items-center justify-between gap-1 border-l border-slate-200/90 bg-slate-50/80 px-2.5 text-xs font-semibold transition-colors ${
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-slate-100/90"
        } ${open ? "bg-white text-brand-primary" : "text-brand-primary"}`
      : `flex h-9 w-full items-center justify-between gap-1 rounded-md border border-slate-200/90 bg-white px-2.5 text-xs font-semibold transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : open
              ? "border-brand-orange-1/50 ring-2 ring-brand-orange-1/15"
              : "hover:border-slate-300"
        } text-brand-primary`
    : `flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-left text-sm transition-all ${
        disabled
          ? "cursor-not-allowed border-slate-200/70 bg-slate-50 opacity-60"
          : open
            ? "border-brand-orange-1/50 ring-2 ring-brand-orange-1/15"
            : "border-slate-200/90 hover:border-slate-300"
      } ${value ? "text-brand-primary" : "text-brand-primary-muted/70"}`;

  return (
    <div
      ref={rootRef}
      className={`relative ${isCompact ? `h-full ${compactAttached ? "" : className}` : className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`${triggerClass} ${isCompact && compactAttached ? `h-full w-full ${className}` : !isCompact ? "" : className}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <Chevron open={open} />
      </button>

      {open &&
        mounted &&
        menuStyle &&
        createPortal(
          <div
            id={`modern-select-menu-${menuId}`}
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 130,
            }}
            className="overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-[0_12px_32px_-8px_rgba(3,31,73,0.2)]"
            role="listbox"
          >
            {searchable && (
              <div className="border-b border-slate-100 p-2">
                <label className="relative block">
                  <span className="sr-only">{searchPlaceholder}</span>
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-9 w-full rounded-sm border border-slate-200/90 bg-slate-50/80 pl-8 pr-2 text-sm text-brand-primary outline-none focus:border-brand-orange-1/40 focus:bg-white"
                    autoFocus
                  />
                </label>
              </div>
            )}

            <ul
              className="overflow-y-auto scrollbar-brand py-1"
              style={{ maxHeight: menuStyle.maxHeight }}
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-center text-xs text-brand-primary-muted">{emptyMessage}</li>
              ) : (
                filtered.map((opt) => {
                  const selected = opt.value === value;
                  return (
                    <li key={opt.value} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        onClick={() => pick(opt.value)}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? "bg-brand-primary/[0.06] font-semibold text-brand-primary"
                            : "text-brand-primary-mid hover:bg-brand-surface-warm hover:text-brand-primary"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {selected && <CheckIcon />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {footer && <div className="border-t border-slate-100 p-2">{footer}</div>}
          </div>,
          document.body
        )}
    </div>
  );
}
