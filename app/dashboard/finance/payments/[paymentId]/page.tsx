import { PaymentViewPage } from "@/components/dashboard/finance/payment-view-page";

type PageProps = {
  params: Promise<{ paymentId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { paymentId } = await params;
  return <PaymentViewPage paymentId={paymentId} />;
}
