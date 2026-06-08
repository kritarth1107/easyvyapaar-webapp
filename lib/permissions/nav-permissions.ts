import type { Permission } from "@/lib/permissions/role-permissions";

/** Minimum permission to show a nav item. `null` = always visible when logged in. */
export const NAV_ITEM_PERMISSIONS: Record<string, Permission | null> = {
  home: null,
  "ai-chat": "reports.read",
  pos: "pos.use",
  "sales-invoice": "sales.write",
  invoices: "sales.read",
  quotations: "sales.read",
  "delivery-challan": "sales.read",
  "credit-notes": "sales.read",
  "sales-returns": "sales.read",
  parties: "parties.read",
  customers: "parties.read",
  suppliers: "parties.read",
  outstanding: "parties.read",
  items: "inventory.read",
  stock: "inventory.read",
  "low-stock": "inventory.read",
  "serial-tracking": "inventory.read",
  godowns: "inventory.read",
  purchases: "purchases.read",
  "purchase-orders": "purchases.read",
  "purchase-returns": "purchases.read",
  payments: "finance.read",
  "cash-bank": "finance.read",
  expenses: "finance.read",
  daybook: "finance.read",
  "reports-hub": "reports.read",
  "gst-reports": "reports.read",
  "financial-reports": "reports.read",
  "inventory-reports": "reports.read",
  "party-reports": "reports.read",
  "staff-list": "staff.read",
  "staff-create": "staff.write",
  payroll: "staff.read",
  attendance: "staff.read",
  "attendance-report": "staff.read",
  "whatsapp-integration": "org.settings.write",
  "business-profile": "org.settings.write",
  "business-bank-accounts": "org.settings.write",
  "invoice-themes": "org.settings.write",
  "print-settings": "org.settings.write",
  team: "members.manage",
  settings: null,
};

export function canAccessNavItem(
  itemId: string,
  flags: Record<Permission, boolean> | null,
): boolean {
  const required = NAV_ITEM_PERMISSIONS[itemId];
  if (required === undefined || required === null) return true;
  if (!flags) return true;
  return Boolean(flags[required]);
}
