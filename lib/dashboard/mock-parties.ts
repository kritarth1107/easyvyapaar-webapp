export const WALK_IN_PARTY_ID = "WALK_IN";

export type PartyType = "customer" | "supplier" | "both";

export type Party = {
  id: string;
  name: string;
  type: PartyType;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  partyCategory?: string;
  city: string;
  state: string;
  billingAddress?: string;
  /** Positive = to collect (receivable). Negative = to pay (payable). */
  balance: number;
  creditLimit?: number;
  lastTransactionDate?: string;
  transactionCount: number;
  isActive: boolean;
};

export const MOCK_PARTIES: Party[] = [
  {
    id: "1",
    name: "MR. AJIT PAIKRA",
    type: "customer",
    phone: "9876501234",
    email: "ajit.paikra@gmail.com",
    city: "Raipur",
    state: "Chhattisgarh",
    balance: 0,
    creditLimit: 50000,
    lastTransactionDate: "2026-05-28",
    transactionCount: 14,
    isActive: true,
  },
  {
    id: "2",
    name: "AJAY KUMAR",
    type: "customer",
    phone: "9123405678",
    city: "Bilaspur",
    state: "Chhattisgarh",
    balance: 0,
    lastTransactionDate: "2026-04-12",
    transactionCount: 6,
    isActive: true,
  },
  {
    id: "3",
    name: "Rahul Mobiles",
    type: "customer",
    phone: "9876543210",
    gstin: "22AAAAA0000A1Z5",
    city: "Raipur",
    state: "Chhattisgarh",
    balance: 12500,
    creditLimit: 100000,
    lastTransactionDate: "2026-06-02",
    transactionCount: 48,
    isActive: true,
  },
  {
    id: "4",
    name: "Sharma Electronics",
    type: "customer",
    phone: "9123456780",
    gstin: "22BBBBB0000B1Z6",
    city: "Durg",
    state: "Chhattisgarh",
    balance: 24838,
    creditLimit: 75000,
    lastTransactionDate: "2026-06-01",
    transactionCount: 32,
    isActive: true,
  },
  {
    id: "5",
    name: "Patel Traders",
    type: "both",
    phone: "9988771122",
    gstin: "24CCCCC0000C1Z7",
    city: "Ahmedabad",
    state: "Gujarat",
    balance: 14691,
    creditLimit: 200000,
    lastTransactionDate: "2026-05-30",
    transactionCount: 67,
    isActive: true,
  },
  {
    id: "6",
    name: "Mehta & Sons",
    type: "supplier",
    phone: "9988001122",
    gstin: "27DDDDD0000D1Z8",
    city: "Mumbai",
    state: "Maharashtra",
    balance: -34200,
    lastTransactionDate: "2026-06-03",
    transactionCount: 89,
    isActive: true,
  },
  {
    id: "7",
    name: "Kumar General Store",
    type: "customer",
    city: "Raipur",
    state: "Chhattisgarh",
    balance: 0,
    lastTransactionDate: "2026-03-18",
    transactionCount: 3,
    isActive: false,
  },
  {
    id: "8",
    name: "Singh Appliances",
    type: "customer",
    phone: "9012345678",
    city: "Bhilai",
    state: "Chhattisgarh",
    balance: 5899,
    creditLimit: 25000,
    lastTransactionDate: "2026-05-25",
    transactionCount: 21,
    isActive: true,
  },
  {
    id: "9",
    name: "Gupta Mobile Point",
    type: "customer",
    phone: "9988776655",
    gstin: "22EEEEE0000E1Z9",
    city: "Raipur",
    state: "Chhattisgarh",
    balance: 47198,
    creditLimit: 150000,
    lastTransactionDate: "2026-06-04",
    transactionCount: 112,
    isActive: true,
  },
  {
    id: "10",
    name: "Walk-in Customer",
    type: "customer",
    city: "Raipur",
    state: "Chhattisgarh",
    balance: 0,
    transactionCount: 0,
    isActive: true,
  },
  {
    id: "11",
    name: "Samsung India Distributor",
    type: "supplier",
    phone: "1800123456",
    gstin: "29FFFFF0000F1Z0",
    email: "accounts@samsung-dist.in",
    city: "Bengaluru",
    state: "Karnataka",
    balance: -128450,
    lastTransactionDate: "2026-06-04",
    transactionCount: 156,
    isActive: true,
  },
  {
    id: "12",
    name: "Voltas AC Wholesale",
    type: "supplier",
    phone: "9876001234",
    gstin: "27GGGGG0000G1Z1",
    city: "Pune",
    state: "Maharashtra",
    balance: -67500,
    lastTransactionDate: "2026-05-29",
    transactionCount: 44,
    isActive: true,
  },
  {
    id: "13",
    name: "Desai Home Appliances",
    type: "both",
    phone: "9123450099",
    gstin: "24HHHHH0000H1Z2",
    city: "Surat",
    state: "Gujarat",
    balance: -8900,
    creditLimit: 80000,
    lastTransactionDate: "2026-05-22",
    transactionCount: 38,
    isActive: true,
  },
  {
    id: "14",
    name: "Nair Electronics Hub",
    type: "customer",
    phone: "9847012345",
    city: "Kochi",
    state: "Kerala",
    balance: 18200,
    creditLimit: 60000,
    lastTransactionDate: "2026-05-31",
    transactionCount: 27,
    isActive: true,
  },
  {
    id: "15",
    name: "Prime Cable Suppliers",
    type: "supplier",
    gstin: "33IIIII0000I1Z3",
    city: "Chennai",
    state: "Tamil Nadu",
    balance: -22100,
    lastTransactionDate: "2026-05-15",
    transactionCount: 19,
    isActive: true,
  },
  {
    id: "16",
    name: "Bansal Retail Chain",
    type: "customer",
    phone: "9811122233",
    gstin: "06JJJJJ0000J1Z4",
    city: "Delhi",
    state: "Delhi",
    balance: 89500,
    creditLimit: 500000,
    lastTransactionDate: "2026-06-03",
    transactionCount: 203,
    isActive: true,
  },
];

export type PartiesPageView = "all" | "customers" | "suppliers" | "outstanding";

export type PartiesSummary = {
  totalParties: number;
  customers: number;
  suppliers: number;
  both: number;
  toCollect: number;
  toPay: number;
  netOutstanding: number;
  withBalance: number;
  overdueCount: number;
};

export function formatPartyBalance(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function getPartiesSummary(parties: Party[] = MOCK_PARTIES): PartiesSummary {
  const list = parties.filter((p) => p.id !== WALK_IN_PARTY_ID);
  const toCollect = list.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const toPay = list
    .filter((p) => p.balance < 0)
    .reduce((s, p) => s + Math.abs(p.balance), 0);

  return {
    totalParties: list.length,
    customers: list.filter((p) => p.type === "customer" || p.type === "both").length,
    suppliers: list.filter((p) => p.type === "supplier" || p.type === "both").length,
    both: list.filter((p) => p.type === "both").length,
    toCollect,
    toPay,
    netOutstanding: toCollect - toPay,
    withBalance: list.filter((p) => p.balance !== 0).length,
    overdueCount: list.filter((p) => p.balance > 10000).length,
  };
}

export function filterPartiesByView(
  parties: Party[],
  view: PartiesPageView,
): Party[] {
  const list = parties.filter((p) => p.id !== WALK_IN_PARTY_ID);

  switch (view) {
    case "customers":
      return list.filter((p) => p.type === "customer" || p.type === "both");
    case "suppliers":
      return list.filter((p) => p.type === "supplier" || p.type === "both");
    case "outstanding":
      return list
        .filter((p) => p.balance !== 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
    default:
      return list;
  }
}
