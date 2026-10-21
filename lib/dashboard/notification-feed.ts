import type { TranslationKey } from "@/lib/localization";

export type NotificationType = "warning" | "info" | "success";

export type DashboardNotification = {
  id: string;
  type: NotificationType;
  titleKey: TranslationKey;
  messageKey: TranslationKey;
  timeKey: TranslationKey;
  href?: string;
};

/**
 * Live shop feed only. Demo rows (5 low-stock, GSTR-1 due, ₹8,000 Rahul Traders)
 * are omitted until a notifications API exists.
 */
export const DASHBOARD_NOTIFICATIONS: DashboardNotification[] = [];
