import type { VerifyOtpSuccessData } from "@/lib/types/auth-api";
import { resolvePostLoginOrganisation } from "@/lib/auth/active-organisation";

export function completeAuthSessionOrganisation(data: VerifyOtpSuccessData) {
  const organisations = data.organisations ?? [];
  const { needsSelection, activeOrganisationId } =
    resolvePostLoginOrganisation(organisations);

  return {
    organisations,
    defaultOrganisationId: data.defaultOrganisationId,
    needsSelection,
    activeOrganisationId,
  };
}
