import Link from "next/link";
import { notFound } from "next/navigation";
import {
  flattenDashboardNavLinks,
  getDashboardPageTitle,
  getDashboardSectionSlug,
} from "@/lib/dashboard/navigation";

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

const VALID_SECTIONS = new Set(
  flattenDashboardNavLinks()
    .map((item) => getDashboardSectionSlug(item.href))
    .filter((slug): slug is string => slug !== null)
);

export default async function DashboardSectionPage({ params }: SectionPageProps) {
  const { section } = await params;

  if (!VALID_SECTIONS.has(section)) {
    notFound();
  }

  const pathname = `/dashboard/${section}`;
  const title = getDashboardPageTitle(pathname);

  return (
    <div className="p-4 lg:p-6">
      <div className="rounded-xs border border-slate-200/90 bg-white p-6 lg:p-8">
        <p className="text-sm font-medium text-brand-primary-muted">{title}</p>
        <h2 className="mt-1 text-xl font-semibold text-brand-primary">Coming soon</h2>
        <p className="mt-2 max-w-lg text-sm text-slate-600">
          This module is planned in the product specification. The shell navigation is ready.
        </p>
        <Link
          href="/dashboard"
          className="login-link mt-4 inline-block text-sm font-semibold hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
