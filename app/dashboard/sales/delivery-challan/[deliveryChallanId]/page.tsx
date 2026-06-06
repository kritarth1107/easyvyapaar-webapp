import { DeliveryChallanViewPage } from "@/components/dashboard/sales/delivery-challan-view-page";

type PageProps = {
  params: Promise<{ deliveryChallanId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { deliveryChallanId } = await params;
  return <DeliveryChallanViewPage deliveryChallanId={deliveryChallanId} />;
}
