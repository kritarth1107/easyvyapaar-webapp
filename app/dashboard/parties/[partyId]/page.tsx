import type { Metadata } from "next";
import { PartyDetailPage } from "@/components/dashboard/parties/party-detail-page";
import { SITE_NAME } from "@/lib/seo/site-metadata";

type PageProps = {
  params: Promise<{ partyId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { partyId } = await params;
  return {
    title: `Party ${partyId} · Dashboard · ${SITE_NAME}`,
    robots: { index: false, follow: false },
  };
}

export default async function PartyDetailRoute({ params }: PageProps) {
  const { partyId } = await params;
  return <PartyDetailPage partyId={partyId} />;
}
