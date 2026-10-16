import { CreateSalesInvoicePage } from "@/components/dashboard/sales/create-sales-invoice-page";

type PageProps = {
  params: Promise<{ invoiceId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { invoiceId } = await params;
  return <CreateSalesInvoicePage editInvoiceId={invoiceId} />;
}
