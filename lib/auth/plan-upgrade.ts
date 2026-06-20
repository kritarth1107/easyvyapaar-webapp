export const PLAN_UPGRADE_SUCCESS_EVENT = "mahajaan:plan-upgrade-success";

/** Notify dashboard shell to reload plan features, nav gates, and shop stats. */
export function emitPlanUpgradeSuccess(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PLAN_UPGRADE_SUCCESS_EVENT));
}
