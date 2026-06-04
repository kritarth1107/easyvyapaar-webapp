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
  | "users"
  | "ai-chat"
  | "whatsapp";

export type DashboardNavAccent = "ai";

export type DashboardNavLink = {
  id: string;
  label: string;
  href: string;
  icon?: DashboardNavIconId;
  /** Short line under the label (e.g. AI Chat) */
  description?: string;
  highlight?: boolean;
  accent?: DashboardNavAccent;
};

export type DashboardNavGroup = {
  id: string;
  label: string;
  icon: DashboardNavIconId;
  defaultOpen?: boolean;
  items: DashboardNavLink[];
};
