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
