"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useOrganisationPermissions } from "@/components/providers/organisation-permissions-provider";
import { useUserMe } from "@/components/providers/user-me-provider";
import { PLAN_UPGRADE_SUCCESS_EVENT } from "@/lib/auth/plan-upgrade";

export function PlanWorkspaceRefreshListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { refresh } = useUserMe();
  const { refreshPermissions } = useOrganisationPermissions();

  const refreshWorkspace = useCallback(async () => {
    await Promise.all([refresh(undefined, { silent: true }), refreshPermissions()]);
  }, [refresh, refreshPermissions]);

  useEffect(() => {
    const onPlanUpgrade = () => {
      void refreshWorkspace();
    };
    window.addEventListener(PLAN_UPGRADE_SUCCESS_EVENT, onPlanUpgrade);
    return () => window.removeEventListener(PLAN_UPGRADE_SUCCESS_EVENT, onPlanUpgrade);
  }, [refreshWorkspace]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get("payment") === "success";
    const planPaymentUtm = params.get("utm") === "plan_payment";
    if (!paymentSuccess && !planPaymentUtm) return;

    void refreshWorkspace();

    if (paymentSuccess) {
      params.delete("payment");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, refreshWorkspace, router]);

  return null;
}
