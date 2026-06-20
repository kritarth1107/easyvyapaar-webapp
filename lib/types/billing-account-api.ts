import type { PlanRenewalReminder } from "@/lib/dashboard/shop-workspace";
import type { PaymentCheckoutContext } from "@/lib/types/auth-api";

export type BillingUsageMetric = {
  used: number;
  limit: number;
  unlimited: boolean;
  label: string;
};

export type BillingAddon = {
  addonCode: string;
  title: string;
  description: string;
  priceLabel: string;
  isAiRelated: boolean;
};

export type BillingAccountSummary = {
  organisationId: string;
  organisationName: string;
  isOwner: boolean;
  canManageBilling: boolean;
  planCode: string;
  planDisplayName: string;
  billingCycle: string;
  subscriptionStatus: string;
  validityStart: string;
  validityEnd: string;
  graceEndsAt: string;
  highlights: string[];
  usage: {
    aiQueries: BillingUsageMetric;
    teamSeats: BillingUsageMetric;
    products: BillingUsageMetric;
    monthlyInvoices: BillingUsageMetric;
  };
  addons: BillingAddon[];
  planRenewalReminder: PlanRenewalReminder;
};

export type BillingTransaction = {
  transactionId: string;
  date: string;
  planCode: string;
  changeType: string;
  billingCycle: string;
  amountPaise: number;
  taxableAmountPaise: number;
  gstAmountPaise: number;
  currency: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentReference?: string;
  invoiceNumber?: string;
  status: string;
  invoiceAvailable: boolean;
  validityStart: string;
  validityEnd: string;
  notes?: string;
  couponCode?: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
};

export type BillingTransactionsResponse = {
  organisationId: string;
  items: BillingTransaction[];
  total: number;
};

export type BillingRenewCheckoutResponse = PaymentCheckoutContext;
