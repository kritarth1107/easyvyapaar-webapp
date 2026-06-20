import type { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/pricing-page-content";
import { normalizePublicPricing } from "@/lib/api/pricing";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { PRICING_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";
import type { PublicPricingResponse } from "@/lib/types/pricing-api";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Pricing. Plans from ₹149/mo for kirana, mobile & wholesale",
  description:
    "Mahajaan pricing for Indian retailers: Starter from ₹149/mo (annual), Pro with AI Chat at ₹299/mo, Business with WhatsApp at ₹499/mo, and Enterprise white-label. Compare vs Vyapar & myBillBook.",
  path: "/pricing",
  keywords: PRICING_KEYWORDS,
});

export const revalidate = 300;

async function loadPricing(): Promise<PublicPricingResponse | null> {
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

export default async function PricingPage() {
  const pricing = await loadPricing();

  if (!pricing) {
    return (
      <section className="bg-brand-surface py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-brand-primary">Pricing</h1>
          <p className="mt-4 text-sm text-brand-primary-muted">
            Pricing is being updated. Please check back shortly or{" "}
            <a href="/contact" className="font-semibold text-brand-orange-2 hover:underline">
              contact us
            </a>
            .
          </p>
        </div>
      </section>
    );
  }

  return <PricingPageContent pricing={pricing} />;
}
