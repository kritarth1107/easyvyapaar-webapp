import type { DashboardNavGroup } from "./navigation-types";

export function getDashboardSectionSlug(href: string): string | null {
  if (href === "/dashboard") return null;
  return href.replace("/dashboard/", "") || null;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getGroupActive(pathname: string, group: DashboardNavGroup): boolean {
  return group.items.some((item) => isNavActive(pathname, item.href));
}
