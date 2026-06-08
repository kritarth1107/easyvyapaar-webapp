"use client";

import { useEffect, useState } from "react";
import { normalizeUserMeResponse } from "@/lib/api/user-me";
import type { UserMeData } from "@/lib/types/user-api";

type MarketingAuthState = {
  user: UserMeData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
};

export function useMarketingAuth(): MarketingAuthState {
  const [user, setUser] = useState<UserMeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        const normalized = normalizeUserMeResponse(body) as { data?: UserMeData };
        if (!cancelled && normalized?.data?.userId) {
          setUser(normalized.data);
        }
      } catch {
        // Guest state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoggedIn: Boolean(user?.userId), isLoading };
}
