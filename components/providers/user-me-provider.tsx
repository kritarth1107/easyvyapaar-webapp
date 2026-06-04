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
  refresh: () => Promise<void>;
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

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/me", { cache: "no-store" });
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
      const orgId = applyActiveOrganisation(success.data);
      if (orgId) {
        await loadShopWorkspace(orgId, false);
      }
    } catch {
      setError("Network error while loading profile");
      setUser(null);
      setActiveOrganisationId(null);
      setShopStats(null);
    } finally {
      setIsLoading(false);
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
      await loadShopWorkspace(organisationId, true);
    },
    [user, activeOrganisationId, loadShopWorkspace]
  );

  const activeOrganisation = useMemo(() => {
    if (!user || !activeOrganisationId) return null;
    return findOrganisationInList(activeOrganisationId, user.organisations) ?? null;
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

  return <UserMeContext.Provider value={value}>{children}</UserMeContext.Provider>;
}

export function useUserMe(): UserMeContextValue {
  const ctx = useContext(UserMeContext);
  if (!ctx) {
    throw new Error("useUserMe must be used within UserMeProvider");
  }
  return ctx;
}
