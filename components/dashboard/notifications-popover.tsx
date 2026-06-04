"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DASHBOARD_NOTIFICATIONS,
  type NotificationType,
} from "@/lib/dashboard/mock-notifications";
import { useTranslation } from "@/lib/localization";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M12 3a5 5 0 00-5 5v3.5L5 14v1h14v-1l-2-2.5V8a5 5 0 00-5-5zM10 18a2 2 0 004 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TYPE_STYLES: Record<
  NotificationType,
  { dot: string; bg: string; icon: string }
> = {
  warning: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    icon: "text-amber-600",
  },
  info: {
    dot: "bg-brand-orange-1",
    bg: "bg-brand-surface",
    icon: "text-brand-orange-2",
  },
  success: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
  },
};

function NotificationIcon({ type }: { type: NotificationType }) {
  const cls = TYPE_STYLES[type].icon;
  if (type === "success") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 ${cls}`} aria-hidden>
        <path
          d="M5 10l3 3 7-7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "warning") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 ${cls}`} aria-hidden>
        <path
          d="M10 4l6 10H4L10 4zM10 8v3M10 14.5v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 ${cls}`} aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4M10 7v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function NotificationsPopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(
    () => new Set(DASHBOARD_NOTIFICATIONS.map((n) => n.id))
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = unreadIds.size;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  function markAllRead() {
    setUnreadIds(new Set());
  }

  function markRead(id: string) {
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-10 w-10 items-center justify-center overflow-visible rounded-xl border transition-colors ${
          open
            ? "border-brand-orange-1/40 bg-brand-surface text-brand-primary ring-2 ring-brand-orange-1/15"
            : "border-slate-200/90 bg-white text-brand-primary-muted hover:border-slate-300 hover:bg-slate-50 hover:text-brand-primary"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("dashboard.notifications")}
      >
        <span className="relative z-0 flex items-center justify-center">
          <BellIcon />
        </span>
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-brand-orange-1 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-1.5rem,360px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-12px_rgba(3,31,73,0.18)]"
          role="dialog"
          aria-label={t("dashboard.notifications")}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-brand-primary">{t("dashboard.notifications")}</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="shrink-0 text-xs font-semibold text-brand-orange-2 transition-colors hover:text-brand-orange-1 hover:underline"
              >
                {t("dashboard.notificationFeed.markAllRead")}
              </button>
            )}
          </div>

          <ul className="max-h-[min(60vh,320px)] overflow-y-auto scrollbar-brand">
            {DASHBOARD_NOTIFICATIONS.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                {t("dashboard.notificationFeed.empty")}
              </li>
            ) : (
              DASHBOARD_NOTIFICATIONS.map((item) => {
                const styles = TYPE_STYLES[item.type];
                const isUnread = unreadIds.has(item.id);
                const inner = (
                  <>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.bg}`}
                    >
                      <NotificationIcon type={item.type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-brand-primary">
                          {t(item.titleKey)}
                        </span>
                        {isUnread && (
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                            aria-hidden
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-600">
                        {t(item.messageKey)}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-brand-primary-muted">
                        {t(item.timeKey)}
                      </span>
                    </span>
                  </>
                );

                const rowClass =
                  "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/90";

                return (
                  <li key={item.id} className="border-b border-slate-100 last:border-b-0">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={rowClass}
                        onClick={() => {
                          markRead(item.id);
                          close();
                        }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={rowClass}
                        onClick={() => markRead(item.id)}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-slate-100 bg-brand-surface/40 px-4 py-2.5">
            <Link
              href="/dashboard/low-stock"
              onClick={close}
              className="block text-center text-xs font-semibold text-brand-orange-2 transition-colors hover:text-brand-orange-1 hover:underline"
            >
              {t("dashboard.notificationFeed.viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
