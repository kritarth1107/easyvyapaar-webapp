import type { DashboardNavGroup, DashboardNavLink } from "./navigation-types";

export type { DashboardNavGroup, DashboardNavIconId, DashboardNavLink } from "./navigation-types";

/** Navigation structure — labels come from i18n via useDashboardNav */
export const DASHBOARD_NAV_TOP: Omit<DashboardNavLink, "label">[] = [
  { id: "home", href: "/dashboard", icon: "home" },
  {
    id: "ai-chat",
    href: "/dashboard/ai-chat",
    icon: "ai-chat",
    accent: "ai",
  },
];

export const DASHBOARD_NAV_POS: Omit<DashboardNavLink, "label"> = {
  id: "pos",
  href: "/dashboard/pos",
  icon: "pos",
  highlight: true,
};

type NavGroupConfig = Omit<DashboardNavGroup, "label" | "items"> & {
  items: Omit<DashboardNavLink, "label">[];
};

export const DASHBOARD_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: "sales",
    icon: "sales",
    defaultOpen: true,
    items: [
      { id: "invoices", href: "/dashboard/invoices", icon: "document" },
      { id: "quotations", href: "/dashboard/quotations", icon: "document" },
      { id: "delivery-challan", href: "/dashboard/delivery-challan", icon: "document" },
      { id: "credit-notes", href: "/dashboard/credit-notes", icon: "document" },
      { id: "sales-returns", href: "/dashboard/sales-returns", icon: "sales" },
    ],
  },
  {
    id: "parties",
    icon: "parties",
    items: [
      { id: "parties", href: "/dashboard/parties", icon: "parties" },
      { id: "customers", href: "/dashboard/customers", icon: "users" },
      { id: "suppliers", href: "/dashboard/suppliers", icon: "users" },
      { id: "outstanding", href: "/dashboard/outstanding", icon: "wallet" },
    ],
  },
  {
    id: "inventory",
    icon: "inventory",
    items: [
      { id: "items", href: "/dashboard/items", icon: "inventory" },
      { id: "stock", href: "/dashboard/stock", icon: "warehouse" },
      { id: "serial-tracking", href: "/dashboard/serial-tracking", icon: "inventory" },
      { id: "godowns", href: "/dashboard/godowns", icon: "warehouse" },
      { id: "low-stock", href: "/dashboard/low-stock", icon: "inventory" },
    ],
  },
  {
    id: "purchase",
    icon: "purchases",
    items: [
      { id: "purchases", href: "/dashboard/purchases", icon: "purchases" },
      { id: "purchase-orders", href: "/dashboard/purchase-orders", icon: "document" },
      { id: "purchase-returns", href: "/dashboard/purchase-returns", icon: "purchases" },
    ],
  },
  {
    id: "finance",
    icon: "payments",
    items: [
      { id: "payments", href: "/dashboard/payments", icon: "payments" },
      { id: "cash-bank", href: "/dashboard/cash-bank", icon: "wallet" },
      { id: "expenses", href: "/dashboard/expenses", icon: "expenses" },
      { id: "daybook", href: "/dashboard/daybook", icon: "document" },
    ],
  },
  {
    id: "reports",
    icon: "reports",
    items: [
      { id: "gst-reports", href: "/dashboard/gst-reports", icon: "reports" },
      { id: "financial-reports", href: "/dashboard/financial-reports", icon: "chart" },
      { id: "inventory-reports", href: "/dashboard/inventory-reports", icon: "warehouse" },
      { id: "party-reports", href: "/dashboard/party-reports", icon: "parties" },
    ],
  },
];

export const DASHBOARD_NAV_BOTTOM: Omit<DashboardNavLink, "label">[] = [
  { id: "staff", href: "/dashboard/staff", icon: "staff" },
  { id: "whatsapp-integration", href: "/dashboard/whatsapp-integration", icon: "whatsapp" },
];

export const DASHBOARD_SETTINGS_GROUP: NavGroupConfig = {
  id: "settings",
  icon: "settings",
  items: [
    { id: "business-profile", href: "/dashboard/business-profile", icon: "settings" },
    { id: "invoice-themes", href: "/dashboard/invoice-themes", icon: "document" },
    { id: "print-settings", href: "/dashboard/print-settings", icon: "settings" },
    { id: "settings", href: "/dashboard/settings", icon: "settings" },
  ],
};
