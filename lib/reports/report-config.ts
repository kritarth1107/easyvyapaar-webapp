import type { DashboardNavIconId } from "@/lib/dashboard/navigation-types";
import type { ReportLink, ReportSlug } from "@/lib/types/reports-api";
import type { TranslationKey } from "@/lib/localization";

export const REPORT_ICON_BY_SLUG: Record<ReportSlug, DashboardNavIconId> = {
  gstr1: "reports",
  gstr2: "reports",
  gstr3b: "reports",
  "gst-sales-hsn": "reports",
  "gst-purchase-hsn": "reports",
  "hsn-wise-sales": "reports",
  "sales-summary": "sales",
  "purchase-summary": "purchases",
  "profit-and-loss": "chart",
  "balance-sheet": "chart",
  "cash-bank": "wallet",
  daybook: "document",
  "party-outstanding": "parties",
  "receivable-ageing": "parties",
  "payable-ageing": "parties",
  "stock-detail": "warehouse",
  "low-stock": "inventory",
  "item-sales-purchase": "inventory",
  "expense-categories": "expenses",
  "bill-wise-profit": "chart",
  "party-report-by-item": "parties",
  "sales-category-wise": "sales",
};

export function getReportDescriptionKey(slug: ReportSlug): TranslationKey {
  return `dashboard.reports.descriptions.${slug}`;
}

export const REPORT_LINKS: ReportLink[] = [
  { slug: "sales-summary", category: "favourite", href: "/dashboard/reports/view/sales-summary" },
  { slug: "party-outstanding", category: "favourite", href: "/dashboard/reports/view/party-outstanding" },
  { slug: "profit-and-loss", category: "favourite", href: "/dashboard/reports/view/profit-and-loss" },
  { slug: "gstr1", category: "gst", href: "/dashboard/reports/view/gstr1" },
  { slug: "gstr2", category: "gst", href: "/dashboard/reports/view/gstr2" },
  { slug: "gstr3b", category: "gst", href: "/dashboard/reports/view/gstr3b" },
  { slug: "gst-sales-hsn", category: "gst", href: "/dashboard/reports/view/gst-sales-hsn" },
  { slug: "gst-purchase-hsn", category: "gst", href: "/dashboard/reports/view/gst-purchase-hsn" },
  { slug: "hsn-wise-sales", category: "gst", href: "/dashboard/reports/view/hsn-wise-sales" },
  { slug: "sales-summary", category: "transaction", href: "/dashboard/reports/view/sales-summary" },
  { slug: "purchase-summary", category: "transaction", href: "/dashboard/reports/view/purchase-summary" },
  { slug: "cash-bank", category: "transaction", href: "/dashboard/reports/view/cash-bank" },
  { slug: "daybook", category: "transaction", href: "/dashboard/reports/view/daybook" },
  { slug: "expense-categories", category: "transaction", href: "/dashboard/reports/view/expense-categories" },
  { slug: "bill-wise-profit", category: "financial", href: "/dashboard/reports/view/bill-wise-profit" },
  { slug: "profit-and-loss", category: "financial", href: "/dashboard/reports/view/profit-and-loss" },
  { slug: "balance-sheet", category: "financial", href: "/dashboard/reports/view/balance-sheet" },
  { slug: "stock-detail", category: "inventory", href: "/dashboard/reports/view/stock-detail" },
  { slug: "low-stock", category: "inventory", href: "/dashboard/reports/view/low-stock" },
  { slug: "item-sales-purchase", category: "item", href: "/dashboard/reports/view/item-sales-purchase" },
  { slug: "party-report-by-item", category: "item", href: "/dashboard/reports/view/party-report-by-item" },
  { slug: "sales-category-wise", category: "item", href: "/dashboard/reports/view/sales-category-wise" },
  { slug: "party-outstanding", category: "party", href: "/dashboard/reports/view/party-outstanding" },
  { slug: "receivable-ageing", category: "party", href: "/dashboard/reports/view/receivable-ageing" },
  { slug: "payable-ageing", category: "party", href: "/dashboard/reports/view/payable-ageing" },
];

export function getReportsByCategory(category: ReportLink["category"]): ReportLink[] {
  const seen = new Set<ReportSlug>();
  return REPORT_LINKS.filter((link) => {
    if (link.category !== category) return false;
    if (seen.has(link.slug)) return false;
    seen.add(link.slug);
    return true;
  });
}

export function getReportTitleKey(slug: ReportSlug): `dashboard.reports.slugs.${ReportSlug}` {
  return `dashboard.reports.slugs.${slug}`;
}
