import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { dataDeletionInstructions } from "@/legal/documents";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Data Deletion Instructions",
  description: dataDeletionInstructions.description,
  path: "/legal/data-deletion-instructions",
  keywords: ["Mahajaan data deletion", "account deletion", "erase personal data"],
});

export default function Page() {
  return <LegalDocumentView document={dataDeletionInstructions} />;
}
