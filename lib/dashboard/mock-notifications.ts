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

export const DASHBOARD_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: "low-stock",
    type: "warning",
    titleKey: "dashboard.notificationFeed.lowStockTitle",
    messageKey: "dashboard.notificationFeed.lowStockMessage",
    timeKey: "dashboard.notificationFeed.lowStockTime",
    href: "/dashboard/inventory/low-stock",
  },
  {
    id: "overdue",
    type: "warning",
    titleKey: "dashboard.notificationFeed.overdueTitle",
    messageKey: "dashboard.notificationFeed.overdueMessage",
    timeKey: "dashboard.notificationFeed.overdueTime",
    href: "/dashboard/outstanding",
  },
  {
    id: "gst",
    type: "info",
    titleKey: "dashboard.notificationFeed.gstTitle",
    messageKey: "dashboard.notificationFeed.gstMessage",
    timeKey: "dashboard.notificationFeed.gstTime",
    href: "/dashboard/gst-reports",
  },
  {
    id: "payment",
    type: "success",
    titleKey: "dashboard.notificationFeed.paymentTitle",
    messageKey: "dashboard.notificationFeed.paymentMessage",
    timeKey: "dashboard.notificationFeed.paymentTime",
    href: "/dashboard/payments",
  },
];
