"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { LOGIN_PATH } from "@/lib/auth/session";
import { useTranslation } from "@/lib/localization";
import { LanguageSelectModal } from "@/components/dashboard/language-select-modal";

function orgInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function MenuIconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIconBusiness() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M3 10l9-5 9 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MenuIconLanguage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MenuIconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
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

type UserAccountMenuProps = {
  onOpenSwitchBusiness?: () => void;
};

export function UserAccountMenu({ onOpenSwitchBusiness }: UserAccountMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, activeOrganisation } = useUserMe();
  const [open, setOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const userInitials = orgInitials(user?.name ?? "U");
  const canOpenBusinessModal = (user?.organisations.length ?? 0) >= 1;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

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

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/authentication/logout", { method: "POST" });
      router.push(LOGIN_PATH);
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const menuItemClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-primary transition-colors hover:bg-slate-50";

  return (
    <>
      <LanguageSelectModal
        open={languageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
      />
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-2.5 transition-colors ${
          open
            ? "border-brand-orange-1/40 bg-brand-surface ring-2 ring-brand-orange-1/15"
            : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("dashboard.accountMenu")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-xs font-bold text-white">
          {userInitials}
        </span>
        <span className="hidden max-w-[120px] truncate text-left md:block">
          <span className="block truncate text-sm font-semibold text-brand-primary">
            {user?.name ?? "User"}
          </span>
          <span className="block truncate text-[11px] text-brand-primary-muted">
            {user?.mobile ? `+91 ${user.mobile}` : t("common.retailErp")}
          </span>
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-1.5rem,280px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-12px_rgba(3,31,73,0.18)]"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="border-b border-slate-100 bg-gradient-to-br from-brand-surface to-white px-4 py-3.5">
            <p className="truncate text-sm font-semibold text-brand-primary">{user?.name}</p>
            <p className="mt-0.5 truncate text-xs text-brand-primary-muted">
              {user?.mobile ? `+91 ${user.mobile}` : ""}
              {user?.email ? ` · ${user.email}` : ""}
            </p>
            {activeOrganisation && (
              <p className="mt-2 truncate rounded-lg bg-brand-primary/[0.06] px-2 py-1 text-[11px] font-medium text-brand-primary">
                {activeOrganisation.name}
              </p>
            )}
          </div>

          <div className="p-2">
            <Link href="/dashboard/settings" role="menuitem" className={menuItemClass} onClick={close}>
              <span className="text-brand-primary-muted">
                <MenuIconSettings />
              </span>
              {t("dashboard.accountSettings")}
            </Link>

            <Link
              href="/dashboard/business-profile"
              role="menuitem"
              className={menuItemClass}
              onClick={close}
            >
              <span className="text-brand-primary-muted">
                <MenuIconBusiness />
              </span>
              {t("dashboard.accountBusinessSettings")}
            </Link>

            {canOpenBusinessModal && onOpenSwitchBusiness && (
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => {
                  close();
                  onOpenSwitchBusiness();
                }}
              >
                <span className="text-brand-primary-muted">
                  <MenuIconBusiness />
                </span>
                {t("orgSelect.switchTitle")}
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                close();
                setLanguageModalOpen(true);
              }}
            >
              <span className="text-brand-primary-muted">
                <MenuIconLanguage />
              </span>
              {t("dashboard.accountLanguage")}
            </button>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <MenuIconLogout />
              {loggingOut ? t("common.pleaseWait") : t("dashboard.accountLogout")}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
