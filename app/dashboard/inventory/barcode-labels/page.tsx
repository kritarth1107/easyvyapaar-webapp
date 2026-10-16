import { BarcodeLabelsPage } from "@/components/dashboard/inventory/barcode-labels-page";

type PageProps = {
  searchParams: Promise<{ ids?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { ids } = await searchParams;
  const raw = Array.isArray(ids) ? ids.join(",") : (ids ?? "");
  const initialIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return <BarcodeLabelsPage initialItemIds={initialIds} />;
}
