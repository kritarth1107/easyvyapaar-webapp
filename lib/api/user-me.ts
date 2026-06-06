import { INDUSTRY_TYPES, type IndustryType } from "@/lib/constants/industry-types";
import { ORGANISATION_TYPES, type OrganisationType } from "@/lib/constants/organisation-types";
import type { OrganisationSummary, UserMeData } from "@/lib/types/user-api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function normalizeOrganisationType(value: unknown): OrganisationType | string | null | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const upper = value.trim().toUpperCase().replace(/\s+/g, "_");
  if ((ORGANISATION_TYPES as readonly string[]).includes(upper)) {
    return upper as OrganisationType;
  }
  return value.trim();
}

function normalizeIndustryType(value: unknown): IndustryType | string | null | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const upper = value.trim().toUpperCase().replace(/\s+/g, "_");
  if ((INDUSTRY_TYPES as readonly string[]).includes(upper)) {
    return upper as IndustryType;
  }
  return value.trim();
}

export function normalizeOrganisationSummary(raw: unknown): OrganisationSummary | null {
  const o = asRecord(raw);
  if (!o) return null;

  const orgId = pickString(o.orgId, o.org_id, o.organisationId, o.organisation_id);
  const name = pickString(o.name, o.tradeName, o.trade_name, o.organisationName);
  if (!orgId || !name) return null;

  return {
    orgId,
    name,
    logo: pickString(o.logo, o.logoUrl, o.logo_url),
    userRole: pickString(o.userRole, o.user_role, o.role) ?? "Member",
    gstNumber:
      pickString(o.gstNumber, o.gst_number, o.gstin, o.gstIN, o.GSTIN) ?? null,
    pan: pickString(o.pan, o.PAN, o.panNumber, o.pan_number) ?? null,
    organisationType: normalizeOrganisationType(
      o.organisationType ?? o.organisation_type ?? o.type ?? o.orgType
    ),
    industryType: normalizeIndustryType(o.industryType ?? o.industry_type),
  };
}

function normalizeOrganisationList(raw: unknown): OrganisationSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeOrganisationSummary(item))
    .filter((item): item is OrganisationSummary => item !== null);
}

/** Pick which organisation the client is working in */
export function resolveRequestedOrganisationId(
  requestedId: string | null | undefined,
  data: UserMeData
): string | null {
  const trimmed = requestedId?.trim();
  if (trimmed) {
    const inList = data.organisations.some((o) => o.orgId === trimmed);
    if (inList) return trimmed;
  }

  const fromDefault = data.defaultOrganisationId?.trim();
  if (fromDefault && data.organisations.some((o) => o.orgId === fromDefault)) {
    return fromDefault;
  }

  if (data.organisations.length === 1) {
    return data.organisations[0].orgId;
  }

  return null;
}

export function findOrganisationById(
  organisations: OrganisationSummary[],
  organisationId: string
): OrganisationSummary | null {
  return organisations.find((o) => o.orgId === organisationId) ?? null;
}

export function buildActiveOrganisation(
  data: UserMeData,
  organisationId: string | null
): OrganisationSummary | null {
  if (!organisationId) return null;

  const fromList = findOrganisationById(data.organisations, organisationId);
  if (fromList) return fromList;

  const fallback = normalizeOrganisationSummary(data.defaultOrganisation);
  if (fallback?.orgId === organisationId) return fallback;

  return null;
}

export function normalizeUserMeData(
  raw: unknown,
  requestedOrganisationId?: string | null
): UserMeData | null {
  const root = asRecord(raw);
  if (!root) return null;

  const organisations = normalizeOrganisationList(root.organisations);
  const defaultOrganisation =
    normalizeOrganisationSummary(root.defaultOrganisation) ??
    (root.defaultOrganisationId
      ? findOrganisationById(organisations, String(root.defaultOrganisationId))
      : null);

  const defaultOrganisationId =
    pickString(root.defaultOrganisationId, root.default_organisation_id) ??
    defaultOrganisation?.orgId;

  const userId = pickString(root.userId, root.user_id);
  const name = pickString(root.name);
  const mobile = pickString(root.mobile);

  if (!userId || !name || !mobile) return null;

  const draft: UserMeData = {
    userId,
    name,
    mobile,
    email: pickString(root.email),
    status: pickString(root.status) ?? "ACTIVE",
    isMobileVerified: Boolean(root.isMobileVerified ?? root.is_mobile_verified),
    preferredLanguage:
      pickString(root.preferredLanguage, root.preferred_language) ?? "en",
    defaultOrganisationId,
    defaultOrganisation: defaultOrganisation ?? undefined,
    organisations,
  };

  const activeId = resolveRequestedOrganisationId(requestedOrganisationId, draft);
  const fromBackendActive = normalizeOrganisationSummary(root.activeOrganisation);

  let activeOrganisation: OrganisationSummary | null = null;

  if (fromBackendActive && (!activeId || fromBackendActive.orgId === activeId)) {
    activeOrganisation = fromBackendActive;
  } else if (activeId) {
    activeOrganisation = buildActiveOrganisation(draft, activeId);
  }

  return { ...draft, activeOrganisation };
}

export function normalizeUserMeResponse(
  body: unknown,
  requestedOrganisationId?: string | null
): unknown {
  const root = asRecord(body);
  if (!root || root.success !== true) return body;

  const dataRaw = root.data;
  const normalized = normalizeUserMeData(dataRaw, requestedOrganisationId);
  if (!normalized) return body;

  return { ...root, data: normalized };
}
