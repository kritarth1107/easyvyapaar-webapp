"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  findOrganisationInList,
  getStoredActiveOrganisationId,
  setStoredActiveOrganisationId,
  syncActiveOrganisationFromProfile,
} from "@/lib/auth/active-organisation";
import {
  fetchShopDashboardStats,
  type ShopDashboardStats,
} from "@/lib/dashboard/shop-workspace";
import { UserMeLoadingOverlay } from "@/components/dashboard/user-me-loading-overlay";
import type { OrganisationSummary, UserMeData } from "@/lib/types/user-api";
import { isApiErrorResponse } from "@/lib/types/auth-api";

type UserMeContextValue = {
  user: UserMeData | null;
  activeOrganisationId: string | null;
  activeOrganisation: OrganisationSummary | null;
  shopStats: ShopDashboardStats | null;
  isLoading: boolean;
  isSwitchingShop: boolean;
  isWorkspaceLoading: boolean;
  error: string | null;
  refresh: (organisationId?: string | null, options?: { silent?: boolean }) => Promise<void>;
  setActiveOrganisation: (organisationId: string) => void;
  switchActiveOrganisation: (organisationId: string) => Promise<void>;
};

const UserMeContext = createContext<UserMeContextValue | null>(null);

export function UserMeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMeData | null>(null);
  const [activeOrganisationId, setActiveOrganisationId] = useState<string | null>(null);
  const [shopStats, setShopStats] = useState<ShopDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingShop, setIsSwitchingShop] = useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const applyActiveOrganisation = useCallback(
    (profile: UserMeData, preferredId?: string | null) => {
      const organisations = profile.organisations ?? [];
      let nextId = preferredId ?? getStoredActiveOrganisationId();

      if (nextId && !findOrganisationInList(nextId, organisations)) {
        nextId = null;
      }

      if (!nextId) {
        nextId = syncActiveOrganisationFromProfile(
          organisations,
          profile.defaultOrganisationId
        );
      } else {
        setStoredActiveOrganisationId(nextId);
      }

      setActiveOrganisationId(nextId);
      return nextId;
    },
    []
  );

  const loadShopWorkspace = useCallback(async (organisationId: string, switching: boolean) => {
    const generation = ++loadGeneration.current;
    if (switching) {
      setIsSwitchingShop(true);
    } else {
      setIsWorkspaceLoading(true);
    }

    try {
      const stats = await fetchShopDashboardStats(organisationId);
      if (generation !== loadGeneration.current) return;
      setShopStats(stats);
    } catch {
      if (generation === loadGeneration.current) {
        setShopStats(null);
      }
    } finally {
      if (generation === loadGeneration.current) {
        setIsSwitchingShop(false);
        setIsWorkspaceLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(async (
    organisationId?: string | null,
    options?: { silent?: boolean }
  ) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);

    const orgParam =
      organisationId?.trim() ||
      getStoredActiveOrganisationId() ||
      undefined;
    const meUrl = orgParam
      ? `/api/user/me?organisationId=${encodeURIComponent(orgParam)}`
      : "/api/user/me";

    try {
      const res = await fetch(meUrl, { cache: "no-store" });
      const body: unknown = await res.json();

      if (!res.ok) {
        const message = isApiErrorResponse(body)
          ? body.error.details ?? body.message
          : "Failed to load profile";
        setError(message);
        setUser(null);
        setActiveOrganisationId(null);
        setShopStats(null);
        return;
      }

      const success = body as { success: boolean; data?: UserMeData };
      if (!success.success || !success.data) {
        setError("Invalid profile response");
        return;
      }

      setUser(success.data);

      let orgId: string | null = null;
      if (success.data.activeOrganisation?.orgId) {
        orgId = success.data.activeOrganisation.orgId;
        setStoredActiveOrganisationId(orgId);
        setActiveOrganisationId(orgId);
      } else {
        orgId = applyActiveOrganisation(success.data);
      }

      if (orgId) {
        await loadShopWorkspace(orgId, false);
      }
    } catch {
      setError("Network error while loading profile");
      setUser(null);
      setActiveOrganisationId(null);
      setShopStats(null);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [applyActiveOrganisation, loadShopWorkspace]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setActiveOrganisation = useCallback(
    (organisationId: string) => {
      if (!user) return;
      if (!findOrganisationInList(organisationId, user.organisations)) return;
      setStoredActiveOrganisationId(organisationId);
      setActiveOrganisationId(organisationId);
    },
    [user]
  );

  const switchActiveOrganisation = useCallback(
    async (organisationId: string) => {
      if (!user) return;
      if (!findOrganisationInList(organisationId, user.organisations)) return;
      if (organisationId === activeOrganisationId) return;

      setStoredActiveOrganisationId(organisationId);
      setActiveOrganisationId(organisationId);
      await Promise.all([
        loadShopWorkspace(organisationId, true),
        refresh(organisationId, { silent: true }),
      ]);
    },
    [user, activeOrganisationId, loadShopWorkspace, refresh]
  );

  const activeOrganisation = useMemo(() => {
    if (!user) return null;
    const id = activeOrganisationId ?? user.activeOrganisation?.orgId ?? null;
    if (!id) return user.activeOrganisation ?? null;

    if (user.activeOrganisation?.orgId === id) {
      return user.activeOrganisation;
    }

    return findOrganisationInList(id, user.organisations) ?? user.activeOrganisation ?? null;
  }, [user, activeOrganisationId]);

  const value = useMemo(
    () => ({
      user,
      activeOrganisationId,
      activeOrganisation,
      shopStats,
      isLoading,
      isSwitchingShop,
      isWorkspaceLoading: isWorkspaceLoading || isSwitchingShop,
      error,
      refresh,
      setActiveOrganisation,
      switchActiveOrganisation,
    }),
    [
      user,
      activeOrganisationId,
      activeOrganisation,
      shopStats,
      isLoading,
      isSwitchingShop,
      isWorkspaceLoading,
      error,
      refresh,
      setActiveOrganisation,
      switchActiveOrganisation,
    ]
  );

  return (
    <UserMeContext.Provider value={value}>
      {children}
      <UserMeLoadingOverlay open={isLoading} />
    </UserMeContext.Provider>
  );
}

export function useUserMe(): UserMeContextValue {
  const ctx = useContext(UserMeContext);
  if (!ctx) {
    throw new Error("useUserMe must be used within UserMeProvider");
  }
  return ctx;
}
