import type { Metadata } from "next";
import { UseCasesPageContent } from "@/components/marketing/use-cases-page-content";
import { USE_CASES_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Use cases — Kirana, electronics, pharmacy, wholesale & textile",
  description:
    "Sector-wise retail ERP for India: kirana FMCG, electronics IMEI, pharmacy batches, wholesale credit, hardware, textile variants — plus AI on WhatsApp for you and your customers.",
  path: "/use-cases",
  keywords: USE_CASES_KEYWORDS,
});

export default function UseCasesPage() {
  return <UseCasesPageContent />;
}
