import type { Metadata } from "next";
import { InventoryPage } from "@/components/dashboard/inventory/inventory-page";
import { SITE_NAME } from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  title: `Items · Dashboard · ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function InventoryItemsPage() {
  return <InventoryPage />;
}
