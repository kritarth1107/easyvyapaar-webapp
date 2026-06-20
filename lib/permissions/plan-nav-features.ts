export type OrganisationPlanFeatures = {
  planCode: string;
  planRank: number;
  aiChat: boolean;
  parties: boolean;
  purchases: boolean;
  advancedReports: boolean;
  whatsapp: boolean;
  invoiceWhatsApp: boolean;
  staffPayroll: boolean;
  salesReturns: boolean;
  financeSuite: boolean;
  gstReports: boolean;
  financialReports: boolean;
};

/** Pro and above (rank ≥ 2). Not available on Starter. */
export const INVOICE_WHATSAPP_MIN_PLAN_RANK = 2;

export function canSendInvoiceWhatsApp(
  planFeatures: OrganisationPlanFeatures | null,
): boolean {
  if (!planFeatures) return false;
  if (typeof planFeatures.invoiceWhatsApp === "boolean") {
    return planFeatures.invoiceWhatsApp;
  }
  return planFeatures.planRank >= INVOICE_WHATSAPP_MIN_PLAN_RANK;
}

export function isInvoiceWhatsAppStarterLocked(
  planFeatures: OrganisationPlanFeatures | null,
): boolean {
  if (!planFeatures) return false;
  return planFeatures.planRank < INVOICE_WHATSAPP_MIN_PLAN_RANK;
}

/** Nav item id → plan feature flag required (null = no plan gate). */
export const NAV_PLAN_FEATURE_REQUIREMENTS: Record<
  string,
  keyof OrganisationPlanFeatures | null
> = {
  "ai-chat": "aiChat",
  parties: "parties",
  customers: "parties",
  suppliers: "parties",
  outstanding: "parties",
  purchases: "purchases",
  "purchase-orders": "purchases",
  "purchase-returns": "purchases",
  "sales-returns": "salesReturns",
  "credit-notes": "salesReturns",
  "delivery-challan": "salesReturns",
  payments: "financeSuite",
  "cash-bank": "financeSuite",
  expenses: "financeSuite",
  daybook: "financeSuite",
  "gst-reports": "gstReports",
  "financial-reports": "financialReports",
  "staff-list": "staffPayroll",
  "staff-create": "staffPayroll",
  payroll: "staffPayroll",
  attendance: "staffPayroll",
  "attendance-report": "staffPayroll",
  "leave-requests": "staffPayroll",
  "whatsapp-integration": "whatsapp",
};

export function canAccessNavItemForPlan(
  itemId: string,
  planFeatures: OrganisationPlanFeatures | null,
): boolean {
  const featureKey = NAV_PLAN_FEATURE_REQUIREMENTS[itemId];
  if (!featureKey) return true;
  if (!planFeatures) return true;
  return Boolean(planFeatures[featureKey]);
}
