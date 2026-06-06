import { SalesInvoiceViewPage } from "@/components/dashboard/sales/sales-invoice-view-page";

type PageProps = {
  params: Promise<{ invoiceId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { invoiceId } = await params;
  return <SalesInvoiceViewPage invoiceId={invoiceId} />;
}
