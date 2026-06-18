import { PayrollMonthDetailPage } from "@/components/dashboard/staff/payroll-month-detail-page";

type PageProps = {
  params: Promise<{ month: string }>;
};

export default async function Page({ params }: PageProps) {
  const { month } = await params;
  return <PayrollMonthDetailPage month={decodeURIComponent(month)} />;
}
