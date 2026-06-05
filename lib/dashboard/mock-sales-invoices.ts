export type SalesInvoiceStatus = "paid" | "partial" | "unpaid" | "cancelled";

export type SalesInvoice = {
  id: string;
  invoiceNo: string;
  date: string;
  partyName: string;
  partyPhone?: string;
  items: number;
  subtotal: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
  status: SalesInvoiceStatus;
  paymentMode?: string;
};

export const MOCK_SALES_INVOICES: SalesInvoice[] = [
  {
    id: "1",
    invoiceNo: "INV-2026-0142",
    date: "2026-06-04",
    partyName: "Rahul Mobiles",
    partyPhone: "9876543210",
    items: 3,
    subtotal: 42880,
    gstAmount: 7718,
    total: 50598,
    amountPaid: 50598,
    status: "paid",
    paymentMode: "UPI",
  },
  {
    id: "2",
    invoiceNo: "INV-2026-0141",
    date: "2026-06-04",
    partyName: "Walk-in Customer",
    items: 1,
    subtotal: 1999,
    gstAmount: 360,
    total: 2359,
    amountPaid: 2359,
    status: "paid",
    paymentMode: "Cash",
  },
  {
    id: "3",
    invoiceNo: "INV-2026-0140",
    date: "2026-06-03",
    partyName: "Sharma Electronics",
    partyPhone: "9123456780",
    items: 2,
    subtotal: 37998,
    gstAmount: 6840,
    total: 44838,
    amountPaid: 20000,
    status: "partial",
    paymentMode: "Bank",
  },
  {
    id: "4",
    invoiceNo: "INV-2026-0139",
    date: "2026-06-03",
    partyName: "Patel Traders",
    items: 5,
    subtotal: 12450,
    gstAmount: 2241,
    total: 14691,
    amountPaid: 0,
    status: "unpaid",
  },
  {
    id: "5",
    invoiceNo: "INV-2026-0138",
    date: "2026-06-02",
    partyName: "Mehta & Sons",
    items: 1,
    subtotal: 22990,
    gstAmount: 4138,
    total: 27128,
    amountPaid: 27128,
    status: "paid",
    paymentMode: "Card",
  },
  {
    id: "6",
    invoiceNo: "INV-2026-0137",
    date: "2026-06-02",
    partyName: "Kumar General Store",
    items: 8,
    subtotal: 3420,
    gstAmount: 616,
    total: 4036,
    amountPaid: 4036,
    status: "paid",
    paymentMode: "Cash",
  },
  {
    id: "7",
    invoiceNo: "INV-2026-0136",
    date: "2026-06-01",
    partyName: "Singh Appliances",
    items: 1,
    subtotal: 4999,
    gstAmount: 900,
    total: 5899,
    amountPaid: 0,
    status: "cancelled",
  },
  {
    id: "8",
    invoiceNo: "INV-2026-0135",
    date: "2026-06-01",
    partyName: "Gupta Mobile Point",
    partyPhone: "9988776655",
    items: 2,
    subtotal: 39998,
    gstAmount: 7200,
    total: 47198,
    amountPaid: 0,
    status: "unpaid",
  },
];

export function getSalesInvoiceSummary(invoices: SalesInvoice[] = MOCK_SALES_INVOICES) {
  const today = "2026-06-04";
  const monthPrefix = "2026-06";

  const todayInvoices = invoices.filter((i) => i.date === today && i.status !== "cancelled");
  const monthInvoices = invoices.filter(
    (i) => i.date.startsWith(monthPrefix) && i.status !== "cancelled"
  );

  const todaySales = todayInvoices.reduce((s, i) => s + i.total, 0);
  const monthSales = monthInvoices.reduce((s, i) => s + i.total, 0);
  const unpaidAmount = invoices
    .filter((i) => i.status === "unpaid" || i.status === "partial")
    .reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const paidToday = todayInvoices.filter((i) => i.status === "paid").length;

  return {
    todaySales,
    monthSales,
    totalCount: invoices.filter((i) => i.status !== "cancelled").length,
    unpaidAmount,
    paidToday,
    partialCount: invoices.filter((i) => i.status === "partial").length,
    unpaidCount: invoices.filter((i) => i.status === "unpaid").length,
  };
}
