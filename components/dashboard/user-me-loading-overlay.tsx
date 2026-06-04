"use client";

import { useTranslation } from "@/lib/localization";

type UserMeLoadingOverlayProps = {
  open: boolean;
};

export function UserMeLoadingOverlay({ open }: UserMeLoadingOverlayProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary/50 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={t("dashboard.loadingWorkspace")}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <div className="relative mx-auto h-14 w-14">
          <span className="absolute inset-0 rounded-full border-2 border-brand-orange-1/25" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-orange-1 border-r-brand-orange-2" />
          <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-gradient-to-br from-brand-orange-2 to-brand-orange-1 text-sm font-bold text-white">
            EV
          </span>
        </div>

        <p className="mt-5 text-base font-semibold text-brand-primary">
          {t("dashboard.loadingWorkspace")}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {t("dashboard.loadingWorkspaceHint")}
        </p>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="dashboard-switch-progress h-full rounded-full bg-gradient-to-r from-brand-orange-2 to-brand-orange-1" />
        </div>
      </div>
    </div>
  );
}
