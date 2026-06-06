"use client";

import Link from "next/link";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";
import {
  getReportDescriptionKey,
  getReportsByCategory,
  REPORT_ICON_BY_SLUG,
} from "@/lib/reports/report-config";
import type { DashboardNavIconId } from "@/lib/dashboard/navigation-types";
import type { ReportLink } from "@/lib/types/reports-api";

function ReportCard({ link }: { link: ReportLink }) {
  const { t } = useTranslation();
  const icon = REPORT_ICON_BY_SLUG[link.slug];
  const descKey = getReportDescriptionKey(link.slug);

  return (
    <li>
      <Link
        href={link.href}
        className="group flex h-full flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-brand-primary/25 hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange-1/10 text-brand-orange-2">
            <NavIcon id={icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-primary group-hover:text-brand-primary-dark">
              {t(`dashboard.reports.slugs.${link.slug}`)}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {t(descKey as TranslationKey)}
            </p>
          </div>
        </div>
        <span className="mt-3 text-xs font-semibold text-brand-orange-2 opacity-0 transition-opacity group-hover:opacity-100">
          Open report →
        </span>
      </Link>
    </li>
  );
}

function ReportSection({ title, links }: { title: string; links: ReportLink[] }) {
  if (links.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <ReportCard key={`${link.category}-${link.slug}`} link={link} />
        ))}
      </ul>
    </section>
  );
}

function CategoryQuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: DashboardNavIconId;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-slate-200/90 bg-white p-4 transition-all hover:border-brand-primary/25 hover:bg-brand-surface/40"
    >
      <div className="flex items-center gap-2">
        <span className="text-brand-orange-2">
          <NavIcon id={icon} className="h-5 w-5" />
        </span>
        <span className="font-semibold text-brand-primary">{title}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{description}</p>
    </Link>
  );
}

export function ReportsHubPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <p className="text-sm text-brand-primary-muted">{t("dashboard.reports.subtitle")}</p>
        <h2 className="text-xl font-bold text-brand-primary lg:text-2xl">{t("dashboard.reports.hubTitle")}</h2>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CategoryQuickLink
          href="/dashboard/reports/gst-reports"
          title={t("dashboard.nav.gstReports")}
          description={t("dashboard.reports.categoryGstDesc")}
          icon="reports"
        />
        <CategoryQuickLink
          href="/dashboard/reports/financial-reports"
          title={t("dashboard.nav.financialReports")}
          description={t("dashboard.reports.categoryFinancialDesc")}
          icon="chart"
        />
        <CategoryQuickLink
          href="/dashboard/reports/inventory-reports"
          title={t("dashboard.nav.inventoryReports")}
          description={t("dashboard.reports.categoryInventoryDesc")}
          icon="warehouse"
        />
        <CategoryQuickLink
          href="/dashboard/reports/party-reports"
          title={t("dashboard.nav.partyReports")}
          description={t("dashboard.reports.categoryPartyDesc")}
          icon="parties"
        />
      </div>

      <div className="space-y-8">
        <ReportSection title={t("dashboard.reports.sectionFavourite")} links={getReportsByCategory("favourite")} />
        <ReportSection title={t("dashboard.reports.sectionGst")} links={getReportsByCategory("gst")} />
        <ReportSection title={t("dashboard.reports.sectionFinancial")} links={getReportsByCategory("financial")} />
        <ReportSection title={t("dashboard.reports.sectionTransaction")} links={getReportsByCategory("transaction")} />
        <ReportSection title={t("dashboard.reports.sectionItem")} links={getReportsByCategory("item")} />
        <ReportSection title={t("dashboard.reports.sectionParty")} links={getReportsByCategory("party")} />
      </div>
    </div>
  );
}

export function ReportCategoryPage({
  category,
}: {
  category: "gst" | "financial" | "inventory" | "party" | "item" | "transaction";
}) {
  const { t } = useTranslation();
  const links = getReportsByCategory(
    category === "financial"
      ? "financial"
      : category === "inventory"
        ? "inventory"
        : category,
  );
  const titleKey =
    category === "gst"
      ? "dashboard.nav.gstReports"
      : category === "financial"
        ? "dashboard.nav.financialReports"
        : category === "inventory"
          ? "dashboard.nav.inventoryReports"
          : category === "party"
            ? "dashboard.nav.partyReports"
            : "dashboard.reports.hubTitle";

  return (
    <div className="p-4 lg:p-6">
      <Link
        href="/dashboard/reports"
        className="text-sm font-semibold text-brand-orange-2 hover:underline"
      >
        ← {t("dashboard.reports.backToHub")}
      </Link>
      <h2 className="mt-2 text-xl font-bold text-brand-primary">{t(titleKey as "dashboard.reports.hubTitle")}</h2>
      <div className="mt-6">
        <ReportSection title={t("dashboard.reports.availableReports")} links={links} />
      </div>
    </div>
  );
}
