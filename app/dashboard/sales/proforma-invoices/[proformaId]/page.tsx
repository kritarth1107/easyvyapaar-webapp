import { QuotationViewPage } from "@/components/dashboard/sales/quotation-view-page";

type PageProps = { params: Promise<{ proformaId: string }> };

export default async function Page({ params }: PageProps) {
  const { proformaId } = await params;
  return <QuotationViewPage quotationId={proformaId} kind="proforma" />;
}
