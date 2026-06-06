import { CreateQuotationPage } from "@/components/dashboard/sales/create-quotation-page";

type PageProps = {
  params: Promise<{ quotationId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { quotationId } = await params;
  return <CreateQuotationPage quotationId={quotationId} />;
}
