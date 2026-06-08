import type { Metadata } from "next";
import { LegalIndexPage } from "@/components/legal/legal-index-page";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Legal",
  description:
    "Privacy Policy, Terms of Service, and Data Deletion Instructions for Mahajaan by ZEROKNOW TECHNOLOGIES PRIVATE LIMITED.",
  path: "/legal",
  keywords: ["Mahajaan legal", "privacy policy", "terms of service", "data deletion"],
});

export default function Page() {
  return <LegalIndexPage />;
}
