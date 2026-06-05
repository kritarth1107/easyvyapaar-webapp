export const ORGANISATION_TYPES = [
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "LLP",
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
  "HUF",
  "TRUST",
  "SOCIETY",
  "NGO",
  "GOVERNMENT",
  "UNREGISTERED",
  "OTHER",
] as const;

export type OrganisationType = (typeof ORGANISATION_TYPES)[number];

export const ORGANISATION_TYPE_LABELS: Record<OrganisationType, string> = {
  PROPRIETORSHIP: "Proprietorship",
  PARTNERSHIP: "Partnership",
  LLP: "LLP",
  PRIVATE_LIMITED: "Private Limited",
  PUBLIC_LIMITED: "Public Limited",
  HUF: "HUF",
  TRUST: "Trust",
  SOCIETY: "Society",
  NGO: "NGO",
  GOVERNMENT: "Government",
  UNREGISTERED: "Unregistered",
  OTHER: "Other",
};

/** Maps GST `constitutionType` (ctb) to our organisation type enum. */
export function mapConstitutionTypeToOrganisationType(
  constitutionType?: string | null,
): OrganisationType | undefined {
  if (!constitutionType?.trim()) return undefined;

  const normalized = constitutionType.trim().toLowerCase();

  if (/proprietor/.test(normalized)) return "PROPRIETORSHIP";
  if (/partnership/.test(normalized)) return "PARTNERSHIP";
  if (/limited liability partnership|\bllp\b/.test(normalized)) return "LLP";
  if (/one person company|\bopc\b/.test(normalized)) return "OTHER";
  if (/private limited|pvt\.?\s*ltd/.test(normalized)) return "PRIVATE_LIMITED";
  if (/public limited/.test(normalized)) return "PUBLIC_LIMITED";
  if (/hindu undivided|\bhuf\b/.test(normalized)) return "HUF";
  if (/\btrust\b/.test(normalized)) return "TRUST";
  if (/\bsociety\b/.test(normalized)) return "SOCIETY";
  if (/\bngo\b|non.?profit/.test(normalized)) return "NGO";
  if (/government|psu|public sector/.test(normalized)) return "GOVERNMENT";
  if (/unregistered/.test(normalized)) return "UNREGISTERED";

  return "OTHER";
}

export function resolveOrganisationTypeLabel(
  organisationType: OrganisationType | "" | undefined,
  options: { value: string; label: string }[],
  fallbackLabel?: string,
): string {
  if (organisationType) {
    const fromOptions = options.find((option) => option.value === organisationType)?.label;
    if (fromOptions) return fromOptions;
    if (organisationType in ORGANISATION_TYPE_LABELS) {
      return ORGANISATION_TYPE_LABELS[organisationType as OrganisationType];
    }
  }

  return fallbackLabel?.trim() ?? "";
}
