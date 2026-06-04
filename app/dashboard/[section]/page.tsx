import { notFound } from "next/navigation";
import { DashboardComingSoon } from "@/components/dashboard/dashboard-coming-soon";
import { getAllDashboardSectionSlugs } from "@/lib/dashboard/navigation";

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

const VALID_SECTIONS = new Set(getAllDashboardSectionSlugs());

export default async function DashboardSectionPage({ params }: SectionPageProps) {
  const { section } = await params;

  if (!VALID_SECTIONS.has(section)) {
    notFound();
  }

  return <DashboardComingSoon section={section} />;
}
