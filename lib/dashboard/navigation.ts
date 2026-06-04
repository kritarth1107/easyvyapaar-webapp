export type DashboardNavIconId =
  | "home"
  | "pos"
  | "sales"
  | "parties"
  | "inventory"
  | "purchases"
  | "payments"
  | "expenses"
  | "reports"
  | "staff"
  | "settings"
  | "document"
  | "chart"
  | "warehouse"
  | "wallet"
  | "users";

export type DashboardNavLink = {
  id: string;
  label: string;
  href: string;
  icon?: DashboardNavIconId;
  highlight?: boolean;
};

export type DashboardNavGroup = {
  id: string;
  label: string;
  icon: DashboardNavIconId;
  defaultOpen?: boolean;
  items: DashboardNavLink[];
};

/** Top-level links (not inside a collapsible group) */
export const DASHBOARD_NAV_TOP: DashboardNavLink[] = [
  { id: "home", label: "Dashboard", href: "/dashboard", icon: "home" },
];

/** Pinned POS CTA — rendered at bottom of sidebar */
export const DASHBOARD_NAV_POS: DashboardNavLink = {
  id: "pos",
  label: "POS Billing",
  href: "/dashboard/pos",
  icon: "pos",
  highlight: true,
};

/** Grouped navigation — 15+ items from product spec */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "sales",
    label: "Sales & Billing",
    icon: "sales",
    defaultOpen: true,
    items: [
      { id: "invoices", label: "Sales Invoices", href: "/dashboard/invoices", icon: "document" },
      { id: "quotations", label: "Quotations", href: "/dashboard/quotations", icon: "document" },
      { id: "delivery-challan", label: "Delivery Challan", href: "/dashboard/delivery-challan", icon: "document" },
      { id: "credit-notes", label: "Credit / Debit Notes", href: "/dashboard/credit-notes", icon: "document" },
      { id: "sales-returns", label: "Sales Returns", href: "/dashboard/sales-returns", icon: "sales" },
    ],
  },
  {
    id: "parties",
    label: "Parties",
    icon: "parties",
    items: [
      { id: "parties", label: "All Parties", href: "/dashboard/parties", icon: "parties" },
      { id: "customers", label: "Customers", href: "/dashboard/customers", icon: "users" },
      { id: "suppliers", label: "Suppliers", href: "/dashboard/suppliers", icon: "users" },
      { id: "outstanding", label: "Outstanding", href: "/dashboard/outstanding", icon: "wallet" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "inventory",
    items: [
      { id: "items", label: "Items", href: "/dashboard/items", icon: "inventory" },
      { id: "stock", label: "Stock Summary", href: "/dashboard/stock", icon: "warehouse" },
      { id: "serial-tracking", label: "Serial / IMEI", href: "/dashboard/serial-tracking", icon: "inventory" },
      { id: "godowns", label: "Godowns", href: "/dashboard/godowns", icon: "warehouse" },
      { id: "low-stock", label: "Low Stock Alerts", href: "/dashboard/low-stock", icon: "inventory" },
    ],
  },
  {
    id: "purchase",
    label: "Purchase",
    icon: "purchases",
    items: [
      { id: "purchases", label: "Purchase Bills", href: "/dashboard/purchases", icon: "purchases" },
      { id: "purchase-orders", label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: "document" },
      { id: "purchase-returns", label: "Purchase Returns", href: "/dashboard/purchase-returns", icon: "purchases" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "payments",
    items: [
      { id: "payments", label: "Payment In / Out", href: "/dashboard/payments", icon: "payments" },
      { id: "cash-bank", label: "Cash & Bank", href: "/dashboard/cash-bank", icon: "wallet" },
      { id: "expenses", label: "Expenses", href: "/dashboard/expenses", icon: "expenses" },
      { id: "daybook", label: "Daybook", href: "/dashboard/daybook", icon: "document" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "reports",
    items: [
      { id: "gst-reports", label: "GST Reports", href: "/dashboard/gst-reports", icon: "reports" },
      { id: "financial-reports", label: "Profit & Loss", href: "/dashboard/financial-reports", icon: "chart" },
      { id: "inventory-reports", label: "Stock Reports", href: "/dashboard/inventory-reports", icon: "warehouse" },
      { id: "party-reports", label: "Party Reports", href: "/dashboard/party-reports", icon: "parties" },
    ],
  },
];

export const DASHBOARD_NAV_BOTTOM: DashboardNavLink[] = [
  { id: "staff", label: "Staff & Payroll", href: "/dashboard/staff", icon: "staff" },
];

export const DASHBOARD_SETTINGS_GROUP: DashboardNavGroup = {
  id: "settings",
  label: "Settings",
  icon: "settings",
  items: [
    { id: "business-profile", label: "Business Profile", href: "/dashboard/business-profile", icon: "settings" },
    { id: "invoice-themes", label: "Invoice Themes", href: "/dashboard/invoice-themes", icon: "document" },
    { id: "print-settings", label: "Print Settings", href: "/dashboard/print-settings", icon: "settings" },
    { id: "settings", label: "App Settings", href: "/dashboard/settings", icon: "settings" },
  ],
};

export function flattenDashboardNavLinks(): DashboardNavLink[] {
  return [
    ...DASHBOARD_NAV_TOP,
    DASHBOARD_NAV_POS,
    ...DASHBOARD_NAV_GROUPS.flatMap((g) => g.items),
    ...DASHBOARD_NAV_BOTTOM,
    ...DASHBOARD_SETTINGS_GROUP.items,
  ];
}

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

export function getDashboardPageTitle(pathname: string): string {
  const link = flattenDashboardNavLinks().find((item) => isNavActive(pathname, item.href));
  if (link) return link.label;
  return "Dashboard";
}
