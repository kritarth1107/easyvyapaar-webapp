"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";
import {
  DASHBOARD_NAV_BOTTOM,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_POS,
  DASHBOARD_NAV_SALES_INVOICE,
  DASHBOARD_NAV_TOP,
  DASHBOARD_SETTINGS_GROUP,
} from "./nav-config";
import { navDescriptionTranslationKey, navTranslationKey } from "./nav-i18n";
import type { DashboardNavGroup, DashboardNavLink } from "./navigation-types";
import { getDashboardSectionSlug, isNavActive } from "./navigation-utils";

function withLabel<T extends { id: string; accent?: DashboardNavLink["accent"] }>(
  item: T,
  kind: "item" | "group",
  t: (key: TranslationKey) => string
): T & { label: string; description?: string } {
  const descriptionKey = kind === "item" ? navDescriptionTranslationKey(item.id) : undefined;
  return {
    ...item,
    label: t(navTranslationKey(item.id, kind)),
    ...(descriptionKey ? { description: t(descriptionKey) } : {}),
  };
}

export function useDashboardNav() {
  const { t } = useTranslation();

  const nav = useMemo(() => {
    const top: DashboardNavLink[] = DASHBOARD_NAV_TOP.map((item) =>
      withLabel(item, "item", t)
    );

    const salesInvoice: DashboardNavLink = {
      ...withLabel(DASHBOARD_NAV_SALES_INVOICE, "item", t),
      highlight: true,
    };

    const pos: DashboardNavLink = {
      ...withLabel(DASHBOARD_NAV_POS, "item", t),
      highlight: true,
    };

    const groups: DashboardNavGroup[] = DASHBOARD_NAV_GROUPS.map((group) => ({
      ...withLabel(group, "group", t),
      defaultOpen: group.defaultOpen,
      icon: group.icon,
      items: group.items.map((item) => withLabel(item, "item", t)),
    }));

    const bottom: DashboardNavLink[] = DASHBOARD_NAV_BOTTOM.map((item) =>
      withLabel(item, "item", t)
    );

    const settingsGroup: DashboardNavGroup = {
      ...withLabel(DASHBOARD_SETTINGS_GROUP, "group", t),
      icon: DASHBOARD_SETTINGS_GROUP.icon,
      items: DASHBOARD_SETTINGS_GROUP.items.map((item) => withLabel(item, "item", t)),
    };

    return { top, salesInvoice, pos, groups, bottom, settingsGroup };
  }, [t]);

  const flattenLinks = useMemo(
    () => [
      ...nav.top,
      nav.salesInvoice,
      nav.pos,
      ...nav.groups.flatMap((g) => g.items),
      ...nav.bottom,
      ...nav.settingsGroup.items,
    ],
    [nav]
  );

  const getPageTitle = (pathname: string) => {
    const link = flattenLinks
      .filter((item) => isNavActive(pathname, item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (link) return link.label;
    return t("dashboard.nav.home");
  };

  const getInventoryBreadcrumb = (pathname: string) => {
    if (!pathname.startsWith("/dashboard/inventory/")) return null;
    return t("dashboard.nav.group.inventory");
  };

  const getSalesBreadcrumb = (pathname: string) => {
    if (!pathname.startsWith("/dashboard/sales/")) return null;
    return t("dashboard.nav.group.sales");
  };

  return { ...nav, flattenLinks, getPageTitle, getInventoryBreadcrumb, getSalesBreadcrumb };
}

export { getDashboardSectionSlug, isNavActive, getGroupActive } from "./navigation-utils";
