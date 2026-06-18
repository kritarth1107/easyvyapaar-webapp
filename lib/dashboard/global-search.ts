import type { DashboardNavLink } from "@/lib/dashboard/navigation-types";
import type { GlobalSearchCategory, GlobalSearchResult } from "@/lib/dashboard/global-search-types";
import { fetchExpenses } from "@/lib/finance/expenses-api-client";
import { fetchFinancePayments } from "@/lib/finance/finance-payments-api-client";
import { fetchInventoryItems, fetchInventorySerialSearch } from "@/lib/inventory/inventory-api-client";
import { fetchParties } from "@/lib/parties/parties-api-client";
import {
  fetchPurchaseBills,
  fetchPurchaseOrders,
  fetchPurchaseReturns,
} from "@/lib/purchase/purchases-api-client";
import { fetchCreditNotes } from "@/lib/sales/credit-notes-api-client";
import { fetchDeliveryChallans } from "@/lib/sales/delivery-challans-api-client";
import { fetchQuotations } from "@/lib/sales/quotations-api-client";
import { fetchSalesInvoices } from "@/lib/sales/sales-api-client";
import { fetchSalesReturns } from "@/lib/sales/sales-returns-api-client";
import { fetchStaffList } from "@/lib/staff/staff-api-client";

const PER_CATEGORY_LIMIT = 5;

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function textMatches(query: string, ...parts: (string | undefined)[]): boolean {
  return parts.some((part) => part?.trim() && part.toLowerCase().includes(query));
}

async function safe<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export function searchNavPages(links: DashboardNavLink[], query: string): GlobalSearchResult[] {
  const q = normalizeQuery(query);
  if (!q) return [];

  return links
    .filter(
      (link) => textMatches(q, link.label, link.description) || textMatches(q, link.href),
    )
    .slice(0, 8)
    .map((link) => ({
      id: `page-${link.id}`,
      category: "pages" as const,
      title: link.label,
      ...(link.description ? { subtitle: link.description } : {}),
      href: link.href,
      iconId: link.icon ?? "document",
    }));
}

export function collectNavLinks(
  nav: {
    top: DashboardNavLink[];
    groups: { items: DashboardNavLink[] }[];
    bottom: DashboardNavLink[];
    settingsGroup: { items: DashboardNavLink[] } | null;
    salesInvoice: DashboardNavLink | null;
    pos: DashboardNavLink | null;
  },
): DashboardNavLink[] {
  const links: DashboardNavLink[] = [
    ...nav.top,
    ...nav.groups.flatMap((group) => group.items),
    ...nav.bottom,
    ...(nav.settingsGroup?.items ?? []),
  ];
  if (nav.salesInvoice) links.push(nav.salesInvoice);
  if (nav.pos) links.push(nav.pos);
  return links;
}

export async function runGlobalSearch(
  organisationId: string,
  query: string,
  navLinks: DashboardNavLink[],
): Promise<GlobalSearchResult[]> {
  const q = normalizeQuery(query);
  if (!q) return [];

  const pageResults = searchNavPages(navLinks, q);

  const [
    parties,
    items,
    serials,
    invoices,
    purchaseBills,
    purchaseOrders,
    purchaseReturns,
    quotations,
    deliveryChallans,
    creditNotes,
    salesReturns,
    expenses,
    payments,
    staff,
  ] = await Promise.all([
    safe(() =>
      fetchParties(organisationId, { view: "all", search: q, limit: PER_CATEGORY_LIMIT, page: 1 }),
    ),
    safe(() => fetchInventoryItems(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchInventorySerialSearch(organisationId, { search: q, limit: PER_CATEGORY_LIMIT })),
    safe(() => fetchSalesInvoices(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchPurchaseBills(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchPurchaseOrders(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchPurchaseReturns(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchQuotations(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchDeliveryChallans(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchCreditNotes(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchSalesReturns(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchExpenses(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchFinancePayments(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
    safe(() => fetchStaffList(organisationId, { search: q, limit: PER_CATEGORY_LIMIT, page: 1 })),
  ]);

  const dataResults: GlobalSearchResult[] = [];
  const serialOnlyItemIds = new Set<string>();

  if (serials) {
    for (const row of serials.items) {
      serialOnlyItemIds.add(row.itemId);
      dataResults.push({
        id: `serial-${row.itemId}-${row.serialNumber}`,
        category: "serials",
        title: row.serialNumber,
        subtitle: [row.itemName, row.sku, row.status.replace(/_/g, " ")].filter(Boolean).join(" · "),
        href: `/dashboard/inventory/items/${row.itemId}`,
        iconId: "inventory",
      });
    }
  }

  if (parties) {
    for (const party of parties.items) {
      dataResults.push({
        id: `party-${party.partyId}`,
        category: "parties",
        title: party.name,
        subtitle: [party.phone, party.gstin, party.type].filter(Boolean).join(" · "),
        href: `/dashboard/parties/${party.partyId}`,
        iconId: "parties",
      });
    }
  }

  if (items) {
    for (const item of items.tableItems) {
      const nameMatches = textMatches(q, item.name, item.sku, item.hsn, item.category);
      const serialMatches = item.availableSerials?.some((serial) =>
        serial.toLowerCase().includes(q),
      );
      if (!nameMatches && (serialMatches || serialOnlyItemIds.has(item.id))) {
        continue;
      }

      dataResults.push({
        id: `item-${item.id}`,
        category: "items",
        title: item.name,
        subtitle: [item.sku, item.category, item.hsn].filter(Boolean).join(" · "),
        href: `/dashboard/inventory/items/${item.id}`,
        iconId: "inventory",
      });
    }
  }

  if (invoices) {
    for (const invoice of invoices.items) {
      dataResults.push({
        id: `invoice-${invoice.invoiceId}`,
        category: "salesInvoices",
        title: invoice.displayNumber,
        subtitle: invoice.partyName,
        href: `/dashboard/sales/invoices/${invoice.invoiceId}`,
        iconId: "document",
      });
    }
  }

  if (purchaseBills) {
    for (const bill of purchaseBills.items) {
      dataResults.push({
        id: `purchase-bill-${bill.purchaseBillId}`,
        category: "purchaseBills",
        title: bill.displayNumber,
        subtitle: bill.partyName,
        href: `/dashboard/purchases/${bill.purchaseBillId}`,
        iconId: "purchases",
      });
    }
  }

  if (purchaseOrders) {
    for (const order of purchaseOrders.items) {
      dataResults.push({
        id: `purchase-order-${order.purchaseOrderId}`,
        category: "purchaseOrders",
        title: order.displayNumber,
        subtitle: order.partyName,
        href: `/dashboard/purchases/purchase-orders/${order.purchaseOrderId}`,
        iconId: "purchases",
      });
    }
  }

  if (purchaseReturns) {
    for (const row of purchaseReturns.items) {
      dataResults.push({
        id: `purchase-return-${row.purchaseReturnId}`,
        category: "purchaseReturns",
        title: row.displayNumber,
        subtitle: row.partyName,
        href: "/dashboard/purchases/purchase-returns",
        iconId: "purchases",
      });
    }
  }

  if (quotations) {
    for (const row of quotations.items) {
      dataResults.push({
        id: `quotation-${row.quotationId}`,
        category: "quotations",
        title: row.displayNumber,
        subtitle: row.partyName,
        href: `/dashboard/sales/quotations/${row.quotationId}`,
        iconId: "document",
      });
    }
  }

  if (deliveryChallans) {
    for (const row of deliveryChallans.items) {
      dataResults.push({
        id: `challan-${row.deliveryChallanId}`,
        category: "deliveryChallans",
        title: row.displayNumber,
        subtitle: row.partyName,
        href: `/dashboard/sales/delivery-challan/${row.deliveryChallanId}`,
        iconId: "document",
      });
    }
  }

  if (creditNotes) {
    for (const row of creditNotes.items) {
      dataResults.push({
        id: `credit-note-${row.creditNoteId}`,
        category: "creditNotes",
        title: row.displayNumber,
        subtitle: row.partyName,
        href: `/dashboard/sales/credit-notes/${row.creditNoteId}`,
        iconId: "document",
      });
    }
  }

  if (salesReturns) {
    for (const row of salesReturns.items) {
      dataResults.push({
        id: `sales-return-${row.salesReturnId}`,
        category: "salesReturns",
        title: row.displayNumber,
        subtitle: row.partyName,
        href: `/dashboard/sales/sales-returns/${row.salesReturnId}`,
        iconId: "sales",
      });
    }
  }

  if (expenses) {
    for (const row of expenses.items) {
      dataResults.push({
        id: `expense-${row.expenseId}`,
        category: "expenses",
        title: row.displayNumber,
        subtitle: [row.categoryName, row.description].filter(Boolean).join(" · "),
        href: "/dashboard/finance/expenses",
        iconId: "expenses",
      });
    }
  }

  if (payments) {
    for (const row of payments.items) {
      dataResults.push({
        id: `payment-${row.paymentId}`,
        category: "payments",
        title: row.displayNumber,
        subtitle: row.partyName,
        href: `/dashboard/finance/payments/${row.paymentId}`,
        iconId: "payments",
      });
    }
  }

  if (staff) {
    for (const member of staff.items) {
      dataResults.push({
        id: `staff-${member.staffId}`,
        category: "staff",
        title: member.name,
        subtitle: [member.phone, member.role, member.department].filter(Boolean).join(" · "),
        href: `/dashboard/staff-payroll/staffs/${member.staffId}`,
        iconId: "staff",
      });
    }
  }

  return [...pageResults, ...dataResults];
}

export const GLOBAL_SEARCH_CATEGORY_ORDER: GlobalSearchCategory[] = [
  "pages",
  "parties",
  "items",
  "serials",
  "salesInvoices",
  "purchaseBills",
  "purchaseOrders",
  "purchaseReturns",
  "quotations",
  "deliveryChallans",
  "creditNotes",
  "salesReturns",
  "expenses",
  "payments",
  "staff",
];
