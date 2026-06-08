import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { termsOfService } from "@/legal/documents";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description: termsOfService.description,
  path: "/legal/terms-of-service",
  keywords: ["Mahajaan terms of service", "terms and conditions", "user agreement"],
});

export default function Page() {
  return <LegalDocumentView document={termsOfService} />;
}
