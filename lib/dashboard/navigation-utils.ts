import type { DashboardNavGroup } from "./navigation-types";

export function getDashboardSectionSlug(href: string): string | null {
  if (href === "/dashboard") return null;
  return href.replace("/dashboard/", "") || null;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Pick the single best-matching href (longest prefix wins). Avoids parent+child both showing active. */
export function resolveActiveNavHref(pathname: string, hrefs: readonly string[]): string | null {
  const match = hrefs
    .filter((href) => isNavActive(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
  return match ?? null;
}

export function getGroupActive(pathname: string, group: DashboardNavGroup): boolean {
  const hrefs = group.items.map((item) => item.href);
  return resolveActiveNavHref(pathname, hrefs) !== null;
}
