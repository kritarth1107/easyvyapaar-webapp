import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { privacyPolicy } from "@/legal/documents";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: privacyPolicy.description,
  path: "/legal/privacy-policy",
  keywords: ["Mahajaan privacy policy", "data protection India", "DPDPA"],
});

export default function Page() {
  return <LegalDocumentView document={privacyPolicy} />;
}
