"use client";

import { useUserMe } from "@/components/providers/user-me-provider";
import { useTranslation } from "@/lib/localization";

export function ShopSwitchOverlay() {
  const { isSwitchingShop, activeOrganisation } = useUserMe();
  const { t } = useTranslation();

  if (!isSwitchingShop) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary/55 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={t("dashboard.switchingShop")}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <div className="relative mx-auto h-14 w-14">
          <span className="absolute inset-0 rounded-full border-2 border-brand-orange-1/25" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-orange-1 border-r-brand-orange-2" />
          <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-brand-surface text-lg font-bold text-brand-primary">
            {(activeOrganisation?.name ?? "?").charAt(0).toUpperCase()}
          </span>
        </div>

        <p className="mt-5 text-base font-semibold text-brand-primary">
          {t("dashboard.switchingShop")}
        </p>
        {activeOrganisation?.name && (
          <p className="mt-1 truncate text-sm text-brand-primary-muted">{activeOrganisation.name}</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{t("dashboard.switchingShopHint")}</p>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="dashboard-switch-progress h-full rounded-full bg-gradient-to-r from-brand-orange-2 to-brand-orange-1" />
        </div>
      </div>
    </div>
  );
}
