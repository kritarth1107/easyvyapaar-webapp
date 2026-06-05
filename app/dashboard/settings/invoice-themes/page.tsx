import { redirect } from "next/navigation";

export default function InvoiceThemesRedirectPage() {
  redirect("/dashboard/sales/invoices/settings");
}
