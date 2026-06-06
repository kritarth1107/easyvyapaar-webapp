import { CreditNoteViewPage } from "@/components/dashboard/sales/credit-note-view-page";

type PageProps = {
  params: Promise<{ creditNoteId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { creditNoteId } = await params;
  return <CreditNoteViewPage creditNoteId={creditNoteId} />;
}
