"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/localization";
import { SITE_NAME } from "@/lib/seo/site-metadata";
import {
  DASHBOARD_NAV_BOTTOM,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_POS,
  DASHBOARD_NAV_SALES_INVOICE,
  DASHBOARD_NAV_TOP,
  DASHBOARD_SETTINGS_GROUP,
} from "./nav-config";
import { navTranslationKey } from "./nav-i18n";

const NAV_LINKS: Array<{ id: string; href: string }> = [
  ...DASHBOARD_NAV_TOP,
  DASHBOARD_NAV_SALES_INVOICE,
  DASHBOARD_NAV_POS,
  ...DASHBOARD_NAV_GROUPS.flatMap((group) => group.items),
  ...DASHBOARD_SETTINGS_GROUP.items,
  ...DASHBOARD_NAV_BOTTOM,
  // Section roots without their own nav item (redirects, detail pages like /dashboard/parties/<id>).
  { id: "parties", href: "/dashboard/parties" },
];

/** Longest nav href that equals the path or is a parent segment of it. */
export function matchDashboardNavId(pathname: string): string | null {
  let best: { id: string; len: number } | null = null;
  for (const link of NAV_LINKS) {
    const href = link.href.replace(/\/$/, "");
    const hit = pathname === href || pathname.startsWith(`${href}/`);
    if (hit && (!best || href.length > best.len)) best = { id: link.id, len: href.length };
  }
  return best?.id ?? null;
}

/**
 * Sets document.title to "<nav label> | Mahajaan" for the current dashboard route.
 * Next writes the segment metadata title ("Dashboard | Mahajaan") on direct loads and after
 * navigations, sometimes after our effect runs, so we watch <head> and re-assert our title
 * whenever something else changes it.
 */
export function useDashboardPageTitle() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  useEffect(() => {
    if (!pathname) return;
    const id = matchDashboardNavId(pathname);
    if (!id) return;
    const title = `${t(navTranslationKey(id, "item"))} | ${SITE_NAME}`;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    const frame = window.requestAnimationFrame(apply);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, t, locale]);
}
