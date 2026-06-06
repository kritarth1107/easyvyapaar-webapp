import type { Metadata } from "next";
import { InventoryItemDetailPage } from "@/components/dashboard/inventory/inventory-item-detail-page";
import { SITE_NAME } from "@/lib/seo/site-metadata";

type PageProps = {
  params: Promise<{ itemId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { itemId } = await params;
  return {
    title: `Item ${itemId} · Dashboard · ${SITE_NAME}`,
    robots: { index: false, follow: false },
  };
}

export default async function InventoryItemDetailRoute({ params }: PageProps) {
  const { itemId } = await params;
  return <InventoryItemDetailPage itemId={itemId} />;
}
