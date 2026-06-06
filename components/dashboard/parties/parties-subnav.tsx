"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/localization";

const TABS = [
  { href: "/dashboard/parties/all-parties", key: "all" as const },
  { href: "/dashboard/parties/customers", key: "customers" as const },
  { href: "/dashboard/parties/suppliers", key: "suppliers" as const },
  { href: "/dashboard/parties/outstanding", key: "outstanding" as const },
];

type PartiesSubnavProps = {
  counts?: Partial<Record<(typeof TABS)[number]["key"], number>>;
};

export function PartiesSubnav({ counts }: PartiesSubnavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const labels: Record<(typeof TABS)[number]["key"], string> = {
    all: t("dashboard.partiesPage.tabs.all"),
    customers: t("dashboard.partiesPage.tabs.customers"),
    suppliers: t("dashboard.partiesPage.tabs.suppliers"),
    outstanding: t("dashboard.partiesPage.tabs.outstanding"),
  };

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2"
      aria-label={t("dashboard.partiesPage.tabsLabel")}
    >
      {TABS.map((tab) => {
        const active =
          tab.href === "/dashboard/parties/all-parties"
            ? pathname === tab.href || pathname === "/dashboard/parties"
            : pathname.startsWith(tab.href);
        const count = counts?.[tab.key];

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-brand-primary text-white shadow-sm"
                : "border border-slate-200/90 bg-white text-brand-primary hover:bg-slate-50"
            }`}
          >
            {labels[tab.key]}
            {count !== undefined && count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-brand-primary-muted"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
