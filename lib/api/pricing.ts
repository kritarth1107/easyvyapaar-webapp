import type {
  PlanFeatureGroup,
  PlanFeatureItem,
  PlanFeatureSeed,
  PublicPricingAddon,
  PublicPricingComparisonRow,
  PublicPricingPlan,
  PublicPricingResponse,
} from "@/lib/types/pricing-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeFeatureItem(raw: unknown): PlanFeatureItem | null {
  const row = asRecord(raw);
  if (!row || typeof row.label !== "string") return null;
  return {
    label: row.label,
    included: Boolean(row.included),
    ...(typeof row.value === "string" && row.value.trim() ? { value: row.value.trim() } : {}),
    ...(typeof row.note === "string" && row.note.trim() ? { note: row.note.trim() } : {}),
  };
}

function normalizeFeatureGroups(raw: unknown): PlanFeatureGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((group) => {
      const row = asRecord(group);
      if (!row || typeof row.title !== "string") return null;
      const items = Array.isArray(row.items)
        ? row.items.map(normalizeFeatureItem).filter((i): i is PlanFeatureItem => i !== null)
        : [];
      return { title: row.title, items };
    })
    .filter((g): g is PlanFeatureGroup => g !== null);
}

function normalizeFeatureSeed(raw: unknown): PlanFeatureSeed {
  const row = asRecord(raw);
  if (!row) return { included: false };
  return {
    included: Boolean(row.included),
    ...(typeof row.value === "string" && row.value.trim() ? { value: row.value.trim() } : {}),
    ...(typeof row.note === "string" && row.note.trim() ? { note: row.note.trim() } : {}),
  };
}

function normalizePlan(raw: unknown): PublicPricingPlan | null {
  const row = asRecord(raw);
  if (!row || typeof row.planCode !== "string" || typeof row.displayName !== "string") return null;

  const highlights = Array.isArray(row.highlights)
    ? row.highlights.filter((f): f is string => typeof f === "string")
    : Array.isArray(row.features)
      ? row.features.filter((f): f is string => typeof f === "string")
      : [];

  return {
    planCode: row.planCode,
    displayName: row.displayName,
    description: typeof row.description === "string" ? row.description : "",
    monthlyPricePaise: Number(row.monthlyPricePaise) || 0,
    yearlyPricePaise: Number(row.yearlyPricePaise) || 0,
    annualMonthlyPricePaise: Number(row.annualMonthlyPricePaise) || 0,
    annualSavingsPaise: Number(row.annualSavingsPaise) || 0,
    annualSavingsPercent: Number(row.annualSavingsPercent) || 0,
    isCustomPricing: Boolean(row.isCustomPricing),
    maxMonthlyBills: Number(row.maxMonthlyBills) || 0,
    maxProducts: Number(row.maxProducts) || 0,
    maxUsers: Number(row.maxUsers) || 1,
    maxBusinesses: Number(row.maxBusinesses) || 1,
    aiChatQueriesPerMonth: Number(row.aiChatQueriesPerMonth) || 0,
    hasWhatsAppIntegration: Boolean(row.hasWhatsAppIntegration),
    highlights,
    featureGroups: normalizeFeatureGroups(row.featureGroups),
    features: highlights,
    highlighted: Boolean(row.highlighted),
    ...(typeof row.badge === "string" && row.badge.trim() ? { badge: row.badge.trim() } : {}),
    ctaLabel: typeof row.ctaLabel === "string" ? row.ctaLabel : "Get started",
    ctaHref: typeof row.ctaHref === "string" ? row.ctaHref : "/auth/register",
  };
}

function normalizeComparisonRow(raw: unknown): PublicPricingComparisonRow | null {
  const row = asRecord(raw);
  if (!row || typeof row.category !== "string" || typeof row.label !== "string") return null;
  const plans = asRecord(row.plans);
  if (!plans) return null;
  return {
    category: row.category,
    label: row.label,
    plans: {
      STARTER: normalizeFeatureSeed(plans.STARTER),
      PRO: normalizeFeatureSeed(plans.PRO),
      BUSINESS: normalizeFeatureSeed(plans.BUSINESS),
      ENTERPRISE: normalizeFeatureSeed(plans.ENTERPRISE),
    },
  };
}

function normalizeAddon(raw: unknown): PublicPricingAddon | null {
  const row = asRecord(raw);
  if (!row || typeof row.addonCode !== "string" || typeof row.title !== "string") return null;

  return {
    addonCode: row.addonCode,
    title: row.title,
    description: typeof row.description === "string" ? row.description : "",
    priceLabel: typeof row.priceLabel === "string" ? row.priceLabel : "",
  };
}

export function normalizePublicPricing(body: unknown): PublicPricingResponse | null {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? root;
  if (!data) return null;

  const plans = Array.isArray(data.plans)
    ? data.plans.map(normalizePlan).filter((p): p is PublicPricingPlan => p !== null)
    : [];
  const comparisonMatrix = Array.isArray(data.comparisonMatrix)
    ? data.comparisonMatrix
        .map(normalizeComparisonRow)
        .filter((r): r is PublicPricingComparisonRow => r !== null)
    : [];
  const addons = Array.isArray(data.addons)
    ? data.addons.map(normalizeAddon).filter((a): a is PublicPricingAddon => a !== null)
    : [];

  if (!plans.length) return null;

  return {
    plans,
    comparisonMatrix,
    addons,
    disclaimer:
      typeof data.disclaimer === "string"
        ? data.disclaimer
        : "GST applicable where required.",
  };
}

export async function loadPublicPricing(): Promise<PublicPricingResponse | null> {
  const { fetchBackend, getApiBaseUrl, parseBackendBody } = await import("@/lib/api/backend");
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  try {
    const response = await fetchBackend(new URL("public/pricing", apiBaseUrl).toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      timeoutMs: 10_000,
    });
    const body = await parseBackendBody(response);
    if (!response.ok) return null;
    return normalizePublicPricing(body);
  } catch {
    return null;
  }
}
