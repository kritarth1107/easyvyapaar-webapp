const SIDEBAR_COLLAPSED_KEY = "mahajaan.sidebarCollapsed";
const LEGACY_SIDEBAR_COLLAPSED_KEYS = ["easydukaan.sidebarCollapsed", "easyvyapaar.sidebarCollapsed"];

export function getSidebarCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") return true;
  return LEGACY_SIDEBAR_COLLAPSED_KEYS.some((key) => localStorage.getItem(key) === "1");
}

export function setSidebarCollapsedPreference(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
}
