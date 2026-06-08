import { dataDeletionInstructions } from "./data-deletion-instructions";
import { privacyPolicy } from "./privacy-policy";
import { termsOfService } from "./terms-of-service";
import type { LegalDocument } from "../types";

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  privacyPolicy,
  termsOfService,
  dataDeletionInstructions,
];

export const LEGAL_DOCUMENTS_BY_SLUG = Object.fromEntries(
  LEGAL_DOCUMENTS.map((doc) => [doc.slug, doc]),
) as Record<string, LegalDocument>;

export { privacyPolicy, termsOfService, dataDeletionInstructions };
