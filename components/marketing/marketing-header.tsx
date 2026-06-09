"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { useMarketingAuth } from "@/lib/marketing/use-marketing-auth";
import { PRIMARY_NAV } from "@/lib/marketing/navigation";
import type { NavDropdownGroup } from "@/lib/marketing/navigation";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DropdownPanel({ groups }: { groups: NavDropdownGroup[] }) {
  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,520px)] rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xl shadow-brand-primary/10">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-primary-muted">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-sm px-2 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-surface"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserInitial({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
      {initial}
    </span>
  );
}

function AuthActions({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { user, isLoggedIn, isLoading, hasSessionHint } = useMarketingAuth();

  if (isLoading && hasSessionHint && !isLoggedIn) {
    return (
      <div className={`flex items-center gap-2 ${mobile ? "mt-3 w-full" : ""}`}>
        <div
          className={`${mobile ? "h-10 w-full" : "h-10 w-28"} animate-pulse rounded-full bg-brand-surface`}
        />
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={`brand-gradient-orange-h inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${
            mobile ? "w-full" : ""
          }`}
        >
          Dashboard
        </Link>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className={`flex items-center gap-3 ${mobile ? "mt-3 flex-col" : ""}`}>
        <div className={`flex items-center gap-2.5 ${mobile ? "w-full justify-center" : ""}`}>
          <UserInitial name={user.name} />
          <div className={mobile ? "text-center" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary-muted">
              Signed in
            </p>
            <p className="max-w-[140px] truncate text-sm font-semibold text-brand-primary">{user.name}</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={`brand-gradient-orange-h inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${
            mobile ? "w-full" : ""
          }`}
        >
          Dashboard
        </Link>
      </div>
    );
  }

  if (mobile) {
    return (
      <>
        <Link
          href="/auth/login"
          className="mt-2 rounded-sm px-3 py-2.5 text-sm font-semibold text-brand-primary"
          onClick={onNavigate}
        >
          Login
        </Link>
        <Link
          href="/contact"
          className="rounded-sm px-3 py-2.5 text-sm font-semibold text-brand-primary"
          onClick={onNavigate}
        >
          Book demo
        </Link>
        <Link
          href="/auth/register"
          className="brand-gradient-orange-h mt-1 rounded-sm px-4 py-3 text-center text-sm font-semibold text-white"
          onClick={onNavigate}
        >
          Sign up free
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/auth/login"
        className="rounded-sm px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-surface"
      >
        Login
      </Link>
      <Link
        href="/contact"
        className="rounded-sm border border-brand-primary/15 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-surface"
      >
        Book demo
      </Link>
      <Link
        href="/auth/register"
        className="brand-gradient-orange-h rounded-sm px-4 py-2 text-sm font-semibold text-white shadow-sm"
      >
        Sign up free
      </Link>
    </>
  );
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center">
          <Image src={BRAND_LOGO} alt="Mahajaan" width={132} height={36} className="h-8 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) =>
            "href" in item ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm font-medium text-brand-primary/85 hover:bg-brand-surface hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ) : (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-medium text-brand-primary/85 hover:bg-brand-surface hover:text-brand-primary"
                >
                  {item.label}
                  <ChevronDown className="h-4 w-4 text-brand-primary-muted" />
                </button>
                {openDropdown === item.label ? <DropdownPanel groups={item.groups} /> : null}
              </div>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <AuthActions />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-slate-200 text-brand-primary lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200/80 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {PRIMARY_NAV.flatMap((item) =>
              "href" in item
                ? [{ label: item.label, href: item.href }]
                : item.groups.flatMap((g) => g.items),
            ).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm px-3 py-2.5 text-sm font-medium text-brand-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <AuthActions mobile onNavigate={() => setMobileOpen(false)} />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
