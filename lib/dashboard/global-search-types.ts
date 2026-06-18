import type { DashboardNavIconId } from "@/lib/dashboard/navigation-types";

export type GlobalSearchCategory =
  | "pages"
  | "parties"
  | "items"
  | "serials"
  | "salesInvoices"
  | "purchaseBills"
  | "purchaseOrders"
  | "purchaseReturns"
  | "quotations"
  | "deliveryChallans"
  | "creditNotes"
  | "salesReturns"
  | "expenses"
  | "payments"
  | "staff";

export type GlobalSearchResult = {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle?: string;
  href: string;
  iconId: DashboardNavIconId;
};
