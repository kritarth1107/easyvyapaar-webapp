import { QuotationViewPage } from "@/components/dashboard/sales/quotation-view-page";

type PageProps = {
  params: Promise<{ quotationId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { quotationId } = await params;
  return <QuotationViewPage quotationId={quotationId} />;
}
