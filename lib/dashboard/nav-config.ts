import type { DashboardNavGroup, DashboardNavLink } from "./navigation-types.ts";

export type { DashboardNavGroup, DashboardNavIconId, DashboardNavLink } from "./navigation-types.ts";

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

export const DASHBOARD_NAV_SALES_INVOICE: Omit<DashboardNavLink, "label"> = {
  id: "sales-invoice",
  href: "/dashboard/sales/invoices/new",
  icon: "document",
  highlight: true,
};

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
      { id: "invoices", href: "/dashboard/sales/invoices", icon: "document" },
      { id: "quotations", href: "/dashboard/sales/quotations", icon: "document" },
      { id: "delivery-challan", href: "/dashboard/sales/delivery-challan", icon: "document" },
      { id: "credit-notes", href: "/dashboard/sales/credit-notes", icon: "document" },
      { id: "sales-returns", href: "/dashboard/sales/sales-returns", icon: "sales" },
    ],
  },
  {
    id: "parties",
    icon: "parties",
    items: [
      { id: "parties", href: "/dashboard/parties/all-parties", icon: "parties" },
      { id: "customers", href: "/dashboard/parties/customers", icon: "users" },
      { id: "suppliers", href: "/dashboard/parties/suppliers", icon: "users" },
      { id: "outstanding", href: "/dashboard/parties/outstanding", icon: "wallet" },
    ],
  },
  {
    id: "inventory",
    icon: "inventory",
    defaultOpen: true,
    items: [
      { id: "items", href: "/dashboard/inventory/items", icon: "inventory" },
      { id: "stock", href: "/dashboard/inventory/stock-summary", icon: "warehouse" },
      { id: "low-stock", href: "/dashboard/inventory/low-stock", icon: "inventory" },
      { id: "serial-tracking", href: "/dashboard/inventory/serial-tracking", icon: "inventory" },
      { id: "godowns", href: "/dashboard/godowns", icon: "warehouse" },
    ],
  },
  {
    id: "purchase",
    icon: "purchases",
    items: [
      { id: "purchases", href: "/dashboard/purchases", icon: "purchases" },
      { id: "purchase-orders", href: "/dashboard/purchases/purchase-orders", icon: "document" },
      { id: "purchase-returns", href: "/dashboard/purchases/purchase-returns", icon: "purchases" },
    ],
  },
  {
    id: "finance",
    icon: "payments",
    items: [
      { id: "payments", href: "/dashboard/finance/payments", icon: "payments" },
      { id: "cash-bank", href: "/dashboard/finance/cash-bank", icon: "wallet" },
      { id: "expenses", href: "/dashboard/finance/expenses", icon: "expenses" },
      { id: "daybook", href: "/dashboard/finance/daybook", icon: "document" },
    ],
  },
  {
    id: "reports",
    icon: "reports",
    items: [
      { id: "reports-hub", href: "/dashboard/reports", icon: "reports" },
      { id: "gst-reports", href: "/dashboard/reports/gst-reports", icon: "reports" },
      { id: "financial-reports", href: "/dashboard/reports/financial-reports", icon: "chart" },
      { id: "inventory-reports", href: "/dashboard/reports/inventory-reports", icon: "warehouse" },
      { id: "party-reports", href: "/dashboard/reports/party-reports", icon: "parties" },
    ],
  },
  {
    id: "staff-payroll",
    icon: "staff",
    items: [
      { id: "staff-list", href: "/dashboard/staff-payroll/staffs", icon: "staff" },
      { id: "staff-create", href: "/dashboard/staff-payroll/staffs/create-new", icon: "staff" },
      { id: "payroll", href: "/dashboard/staff-payroll/payroll", icon: "wallet" },
      { id: "attendance", href: "/dashboard/staff-payroll/attendance", icon: "document" },
      { id: "attendance-report", href: "/dashboard/staff-payroll/attendance/report", icon: "chart" },
    ],
  },
];

export const DASHBOARD_NAV_BOTTOM: Omit<DashboardNavLink, "label">[] = [
  { id: "whatsapp-integration", href: "/dashboard/integrations/whatsapp-integration", icon: "whatsapp" },
];

export const DASHBOARD_SETTINGS_GROUP: NavGroupConfig = {
  id: "settings",
  icon: "settings",
  items: [
    { id: "business-profile", href: "/dashboard/settings/business-profile", icon: "settings" },
    {
      id: "business-bank-accounts",
      href: "/dashboard/settings/business-bank-accounts",
      icon: "wallet",
    },
    { id: "invoice-themes", href: "/dashboard/sales/invoices/settings", icon: "document" },
    { id: "print-settings", href: "/dashboard/settings/print-settings", icon: "settings" },
    { id: "settings", href: "/dashboard/settings/settings", icon: "settings" },
  ],
};
