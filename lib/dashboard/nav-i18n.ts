import type { TranslationKey } from "@/lib/localization";

const NAV_ITEM_DESCRIPTION_KEYS: Record<string, TranslationKey> = {
  "ai-chat": "dashboard.nav.aiChatHint",
};

const NAV_ITEM_KEYS: Record<string, TranslationKey> = {
  home: "dashboard.nav.home",
  "ai-chat": "dashboard.nav.aiChat",
  "whatsapp-integration": "dashboard.nav.whatsappIntegration",
  pos: "dashboard.nav.pos",
  "sales-invoice": "dashboard.nav.salesInvoice",
  invoices: "dashboard.nav.invoices",
  quotations: "dashboard.nav.quotations",
  "delivery-challan": "dashboard.nav.deliveryChallan",
  "credit-notes": "dashboard.nav.creditNotes",
  "sales-returns": "dashboard.nav.salesReturns",
  parties: "dashboard.nav.allParties",
  customers: "dashboard.nav.customers",
  suppliers: "dashboard.nav.suppliers",
  outstanding: "dashboard.nav.outstanding",
  items: "dashboard.nav.items",
  stock: "dashboard.nav.stock",
  "serial-tracking": "dashboard.nav.serialTracking",
  godowns: "dashboard.nav.godowns",
  "low-stock": "dashboard.nav.lowStockNav",
  purchases: "dashboard.nav.purchases",
  "purchase-orders": "dashboard.nav.purchaseOrders",
  "purchase-returns": "dashboard.nav.purchaseReturns",
  payments: "dashboard.nav.payments",
  "cash-bank": "dashboard.nav.cashBank",
  expenses: "dashboard.nav.expenses",
  daybook: "dashboard.nav.daybook",
  "reports-hub": "dashboard.nav.reportsHub",
  "gst-reports": "dashboard.nav.gstReports",
  "financial-reports": "dashboard.nav.financialReports",
  "inventory-reports": "dashboard.nav.inventoryReports",
  "party-reports": "dashboard.nav.partyReports",
  staff: "dashboard.nav.staff",
  "staff-list": "dashboard.nav.staffList",
  "staff-create": "dashboard.nav.staffCreate",
  payroll: "dashboard.nav.payroll",
  attendance: "dashboard.nav.attendance",
  "attendance-report": "dashboard.nav.attendanceReport",
  "leave-requests": "dashboard.nav.leaveRequests",
  "business-profile": "dashboard.nav.businessProfile",
  "business-bank-accounts": "dashboard.nav.businessBankAccounts",
  "invoice-themes": "dashboard.nav.invoiceThemes",
  "print-settings": "dashboard.nav.printSettings",
  team: "dashboard.nav.team",
  settings: "dashboard.nav.appSettings",
};

const NAV_GROUP_KEYS: Record<string, TranslationKey> = {
  sales: "dashboard.nav.group.sales",
  parties: "dashboard.nav.group.parties",
  inventory: "dashboard.nav.group.inventory",
  purchase: "dashboard.nav.group.purchase",
  finance: "dashboard.nav.group.finance",
  reports: "dashboard.nav.group.reports",
  "staff-payroll": "dashboard.nav.group.staffPayroll",
  settings: "dashboard.nav.group.settings",
};

export function navDescriptionTranslationKey(id: string): TranslationKey | undefined {
  return NAV_ITEM_DESCRIPTION_KEYS[id];
}

export function navTranslationKey(id: string, kind: "item" | "group"): TranslationKey {
  const map = kind === "group" ? NAV_GROUP_KEYS : NAV_ITEM_KEYS;
  const key = map[id];
  if (key) return key;
  const camel = id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return (kind === "group"
    ? `dashboard.nav.group.${camel}`
    : `dashboard.nav.${camel}`) as TranslationKey;
}
