import { SalesReturnViewPage } from "@/components/dashboard/sales/sales-return-view-page";

type PageProps = {
  params: Promise<{ salesReturnId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { salesReturnId } = await params;
  return <SalesReturnViewPage salesReturnId={salesReturnId} />;
}
