export type PlanFeatureItem = {
  label: string;
  value?: string;
  included: boolean;
  note?: string;
};

export type PlanFeatureGroup = {
  title: string;
  items: PlanFeatureItem[];
};

export type PlanFeatureSeed = {
  included: boolean;
  value?: string;
  note?: string;
};

export type PublicPricingPlan = {
  planCode: string;
  displayName: string;
  description: string;
  monthlyPricePaise: number;
  yearlyPricePaise: number;
  annualMonthlyPricePaise: number;
  annualSavingsPaise: number;
  annualSavingsPercent: number;
  isCustomPricing: boolean;
  maxMonthlyBills: number;
  maxProducts: number;
  maxUsers: number;
  maxBusinesses: number;
  aiChatQueriesPerMonth: number;
  hasWhatsAppIntegration: boolean;
  highlights: string[];
  featureGroups: PlanFeatureGroup[];
  features: string[];
  highlighted: boolean;
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
};

export type PublicPricingComparisonRow = {
  category: string;
  label: string;
  plans: {
    STARTER: PlanFeatureSeed;
    PRO: PlanFeatureSeed;
    BUSINESS: PlanFeatureSeed;
    ENTERPRISE: PlanFeatureSeed;
  };
};

export type PublicPricingAddon = {
  addonCode: string;
  title: string;
  description: string;
  priceLabel: string;
};

export type PublicPricingResponse = {
  plans: PublicPricingPlan[];
  comparisonMatrix: PublicPricingComparisonRow[];
  addons: PublicPricingAddon[];
  disclaimer: string;
};

export const PAID_PLAN_CODES = ["STARTER", "PRO", "BUSINESS"] as const;
