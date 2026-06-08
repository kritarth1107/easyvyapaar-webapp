import { redirect } from "next/navigation";

/** POS billing uses the sales invoice flow. */
export default function PosPage() {
  redirect("/dashboard/sales/invoices/new");
}
