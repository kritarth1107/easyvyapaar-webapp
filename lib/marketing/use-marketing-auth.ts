"use client";

import { useEffect, useState } from "react";
import { hasClientSessionHint } from "@/lib/auth/client-session-hint";
import { normalizeUserMeResponse } from "@/lib/api/user-me";
import type { UserMeData } from "@/lib/types/user-api";

const ME_FETCH_TIMEOUT_MS = 10_000;

type MarketingAuthState = {
  user: UserMeData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  hasSessionHint: boolean;
};

export function useMarketingAuth(): MarketingAuthState {
  const [user, setUser] = useState<UserMeData | null>(null);
  const [hasSessionHint, setHasSessionHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hint = hasClientSessionHint();
    setHasSessionHint(hint);

    if (!hint) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ME_FETCH_TIMEOUT_MS);

    async function load() {
      try {
        const res = await fetch("/api/user/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = await res.json();
        const normalized = normalizeUserMeResponse(body) as { data?: UserMeData };
        if (!cancelled && normalized?.data?.userId) {
          setUser(normalized.data);
        }
      } catch {
        // Keep guest UI on timeout/network errors.
      } finally {
        window.clearTimeout(timer);
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return {
    user,
    isLoggedIn: Boolean(user?.userId),
    isLoading,
    hasSessionHint,
  };
}
