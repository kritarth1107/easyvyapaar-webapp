import { extractBackendError } from "@/lib/api/inventory";
import type { Permission } from "@/lib/permissions/role-permissions";
import type { UserRole } from "@/lib/permissions/role-permissions";

export type OrganisationPermissions = {
  role: UserRole;
  permissions: Permission[];
  flags: Record<Permission, boolean>;
};

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrganisationPermissions(
  organisationId: string,
): Promise<OrganisationPermissions | null> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/my-permissions`,
    { cache: "no-store" },
  );
  const body = await parseJson(res);
  if (!res.ok) return null;
  const data = (body as { data?: OrganisationPermissions }).data;
  return data ?? null;
}
