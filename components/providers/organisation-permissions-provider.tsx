"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  fetchOrganisationPermissions,
  type OrganisationPermissions,
} from "@/lib/permissions/organisation-permissions-api-client";
import {
  getPermissionFlags,
  type Permission,
  type UserRole,
} from "@/lib/permissions/role-permissions";
import { canAccessNavItem } from "@/lib/permissions/nav-permissions";

type OrganisationPermissionsContextValue = {
  role: UserRole | null;
  flags: Record<Permission, boolean> | null;
  permissions: Permission[];
  loading: boolean;
  can: (permission: Permission) => boolean;
  canNav: (itemId: string) => boolean;
  refreshPermissions: () => Promise<void>;
};

const OrganisationPermissionsContext =
  createContext<OrganisationPermissionsContextValue | null>(null);

export function OrganisationPermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeOrganisationId, activeOrganisation } = useUserMe();
  const [remote, setRemote] = useState<OrganisationPermissions | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshPermissions = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setRemote(null);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOrganisationPermissions(orgId);
      setRemote(data);
    } catch {
      setRemote(null);
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId]);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  const role = (remote?.role ?? activeOrganisation?.userRole ?? null) as UserRole | null;
  const flags = useMemo(() => {
    if (remote?.flags) return remote.flags;
    if (role) return getPermissionFlags(role);
    return null;
  }, [remote, role]);

  const permissions = remote?.permissions ?? (role ? Object.entries(flags ?? {}).filter(([, v]) => v).map(([k]) => k as Permission) : []);

  const value = useMemo<OrganisationPermissionsContextValue>(
    () => ({
      role,
      flags,
      permissions,
      loading,
      can: (permission) => Boolean(flags?.[permission]),
      canNav: (itemId) => canAccessNavItem(itemId, flags),
      refreshPermissions,
    }),
    [role, flags, permissions, loading, refreshPermissions],
  );

  return (
    <OrganisationPermissionsContext.Provider value={value}>
      {children}
    </OrganisationPermissionsContext.Provider>
  );
}

export function useOrganisationPermissions(): OrganisationPermissionsContextValue {
  const ctx = useContext(OrganisationPermissionsContext);
  if (!ctx) {
    throw new Error("useOrganisationPermissions must be used within OrganisationPermissionsProvider");
  }
  return ctx;
}
