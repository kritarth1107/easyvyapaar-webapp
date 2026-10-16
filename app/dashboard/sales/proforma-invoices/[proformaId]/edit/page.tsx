import { CreateQuotationPage } from "@/components/dashboard/sales/create-quotation-page";

type PageProps = { params: Promise<{ proformaId: string }> };

export default async function Page({ params }: PageProps) {
  const { proformaId } = await params;
  return <CreateQuotationPage quotationId={proformaId} kind="proforma" />;
}
