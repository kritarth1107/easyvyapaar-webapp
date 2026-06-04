import {
  DASHBOARD_NAV_BOTTOM,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_POS,
  DASHBOARD_NAV_TOP,
  DASHBOARD_SETTINGS_GROUP,
} from "./nav-config";
import { navTranslationKey } from "./nav-i18n";
import type { DashboardNavGroup, DashboardNavLink } from "./navigation-types";
import {
  getDashboardSectionSlug,
  getGroupActive,
  isNavActive,
} from "./navigation-utils";
import { enMessages } from "@/lib/localization/messages/en";

function labelFromKey(id: string, kind: "item" | "group"): string {
  const key = navTranslationKey(id, kind);
  const parts = key.split(".");
  let current: unknown = enMessages;
  for (const part of parts) {
    if (current === null || typeof current !== "object" || !(part in current)) {
      return id;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : id;
}

function withEnglishLabel<T extends { id: string }>(
  item: T,
  kind: "item" | "group"
): T & { label: string } {
  return { ...item, label: labelFromKey(item.id, kind) };
}

/** English labels for server/static use (e.g. section validation) */
export function flattenDashboardNavLinks(): DashboardNavLink[] {
  const top = DASHBOARD_NAV_TOP.map((item) => withEnglishLabel(item, "item"));
  const pos = { ...withEnglishLabel(DASHBOARD_NAV_POS, "item"), highlight: true };
  const groups = DASHBOARD_NAV_GROUPS.map((group) => ({
    ...withEnglishLabel(group, "group"),
    defaultOpen: group.defaultOpen,
    icon: group.icon,
    items: group.items.map((item) => withEnglishLabel(item, "item")),
  }));
  const bottom = DASHBOARD_NAV_BOTTOM.map((item) => withEnglishLabel(item, "item"));
  const settingsGroup: DashboardNavGroup = {
    ...withEnglishLabel(DASHBOARD_SETTINGS_GROUP, "group"),
    icon: DASHBOARD_SETTINGS_GROUP.icon,
    items: DASHBOARD_SETTINGS_GROUP.items.map((item) => withEnglishLabel(item, "item")),
  };

  return [
    ...top,
    pos,
    ...groups.flatMap((g) => g.items),
    ...bottom,
    ...settingsGroup.items,
  ];
}

export function getAllDashboardSectionSlugs(): string[] {
  return flattenDashboardNavLinks()
    .map((item) => getDashboardSectionSlug(item.href))
    .filter((slug): slug is string => slug !== null);
}

export function getDashboardPageTitle(pathname: string): string {
  const link = flattenDashboardNavLinks().find((item) => isNavActive(pathname, item.href));
  if (link) return link.label;
  return labelFromKey("home", "item");
}

export { getDashboardSectionSlug, getGroupActive, isNavActive };
