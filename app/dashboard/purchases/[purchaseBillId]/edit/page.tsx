import { CreatePurchaseBillPage } from "@/components/dashboard/purchase/create-purchase-bill-page";

type PageProps = { params: Promise<{ purchaseBillId: string }> };

export default async function Page({ params }: PageProps) {
  const { purchaseBillId } = await params;
  return <CreatePurchaseBillPage purchaseBillId={purchaseBillId} />;
}
