"use client";

import Link from "next/link";
import { useDashboardNav } from "@/lib/dashboard/use-dashboard-nav";
import { useTranslation } from "@/lib/localization";

type DashboardComingSoonProps = {
  section: string;
};

export function DashboardComingSoon({ section }: DashboardComingSoonProps) {
  const { t } = useTranslation();
  const { getPageTitle } = useDashboardNav();
  const pathname = `/dashboard/${section}`;
  const title = getPageTitle(pathname);

  return (
    <div className="p-4 lg:p-6">
      <div className="rounded-xs border border-slate-200/90 bg-white p-6 lg:p-8">
        <p className="text-sm font-medium text-brand-primary-muted">{title}</p>
        <h2 className="mt-1 text-xl font-semibold text-brand-primary">{t("dashboard.comingSoon")}</h2>
        <p className="mt-2 max-w-lg text-sm text-slate-600">{t("dashboard.comingSoonHint")}</p>
        <Link
          href="/dashboard"
          className="login-link mt-4 inline-block text-sm font-semibold hover:underline"
        >
          {t("dashboard.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
