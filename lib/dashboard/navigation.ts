export type {
  DashboardNavGroup,
  DashboardNavIconId,
  DashboardNavLink,
} from "./navigation-types";

export {
  DASHBOARD_NAV_BOTTOM,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_POS,
  DASHBOARD_NAV_TOP,
  DASHBOARD_SETTINGS_GROUP,
} from "./nav-config";

export {
  flattenDashboardNavLinks,
  getAllDashboardSectionSlugs,
  getDashboardPageTitle,
  getDashboardSectionSlug,
  getGroupActive,
  isNavActive,
  resolveActiveNavHref,
} from "./navigation-legacy";

export { useDashboardNav } from "./use-dashboard-nav";
