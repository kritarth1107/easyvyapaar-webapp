"use client";

import { useMemo } from "react";
import { useOrganisationPermissions } from "@/components/providers/organisation-permissions-provider";
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
import { getDashboardSectionSlug, isNavActive, resolveActiveNavHref } from "./navigation-utils";

function withLabel<T extends { id: string; accent?: DashboardNavLink["accent"] }>(
  item: T,
  kind: "item" | "group",
  t: (key: TranslationKey) => string,
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
  const { canNav } = useOrganisationPermissions();

  const nav = useMemo(() => {
    const top: DashboardNavLink[] = DASHBOARD_NAV_TOP.filter((item) => canNav(item.id)).map(
      (item) => withLabel(item, "item", t),
    );

    const salesInvoice: DashboardNavLink | null = canNav(DASHBOARD_NAV_SALES_INVOICE.id)
      ? { ...withLabel(DASHBOARD_NAV_SALES_INVOICE, "item", t), highlight: true }
      : null;

    const pos: DashboardNavLink | null = canNav(DASHBOARD_NAV_POS.id)
      ? { ...withLabel(DASHBOARD_NAV_POS, "item", t), highlight: true }
      : null;

    const groups: DashboardNavGroup[] = DASHBOARD_NAV_GROUPS.reduce<DashboardNavGroup[]>(
      (acc, group) => {
        const items = group.items
          .filter((item) => canNav(item.id))
          .map((item) => withLabel(item, "item", t));
        if (items.length === 0) return acc;
        acc.push({
          ...withLabel(group, "group", t),
          defaultOpen: group.defaultOpen,
          icon: group.icon,
          items,
        });
        return acc;
      },
      [],
    );

    const bottom: DashboardNavLink[] = DASHBOARD_NAV_BOTTOM.filter((item) => canNav(item.id)).map(
      (item) => withLabel(item, "item", t),
    );

    const settingsItems = DASHBOARD_SETTINGS_GROUP.items
      .filter((item) => canNav(item.id))
      .map((item) => withLabel(item, "item", t));

    const settingsGroup: DashboardNavGroup | null =
      settingsItems.length > 0
        ? {
            ...withLabel(DASHBOARD_SETTINGS_GROUP, "group", t),
            icon: DASHBOARD_SETTINGS_GROUP.icon,
            items: settingsItems,
          }
        : null;

    return { top, salesInvoice, pos, groups, bottom, settingsGroup };
  }, [t, canNav]);

  const flattenLinks = useMemo(
    () => [
      ...nav.top,
      ...(nav.salesInvoice ? [nav.salesInvoice] : []),
      ...(nav.pos ? [nav.pos] : []),
      ...nav.groups.flatMap((g) => g.items),
      ...nav.bottom,
      ...(nav.settingsGroup?.items ?? []),
    ],
    [nav],
  );

  const getPageTitle = (pathname: string) => {
    const activeHref = resolveActiveNavHref(
      pathname,
      flattenLinks.map((item) => item.href),
    );
    const link = activeHref ? flattenLinks.find((item) => item.href === activeHref) : undefined;
    if (link) return link.label;
    return t("dashboard.nav.home");
  };

  const getActiveNavHref = (pathname: string) =>
    resolveActiveNavHref(
      pathname,
      flattenLinks.map((item) => item.href),
    );

  const getInventoryBreadcrumb = (pathname: string) => {
    if (!pathname.startsWith("/dashboard/inventory/")) return null;
    return t("dashboard.nav.group.inventory");
  };

  const getSalesBreadcrumb = (pathname: string) => {
    if (!pathname.startsWith("/dashboard/sales/")) return null;
    return t("dashboard.nav.group.sales");
  };

  return { ...nav, flattenLinks, getPageTitle, getActiveNavHref, getInventoryBreadcrumb, getSalesBreadcrumb };
}

export { getDashboardSectionSlug, isNavActive, getGroupActive, resolveActiveNavHref } from "./navigation-utils";
