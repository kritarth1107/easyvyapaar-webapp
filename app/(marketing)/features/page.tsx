import type { Metadata } from "next";
import { FeaturesPageContent } from "@/components/marketing/features-page-content";
import { FEATURES_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Features — GST billing, POS, inventory, AI chat & payroll",
  description:
    "Full retail ERP modules: GST invoices, fast POS, serial & batch inventory, party ledger, purchases, P&L, balance sheet, low-stock alerts, WhatsApp-ready AI assistant, and staff payroll. Compare with Vyapar, myBillBook, Marg ERP, Busy & GoFrugal.",
  path: "/features",
  keywords: FEATURES_KEYWORDS,
});

export default function FeaturesPage() {
  return <FeaturesPageContent />;
}
