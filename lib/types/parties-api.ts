export type PartyType = "customer" | "supplier" | "both";

export type PartiesPageView = "all" | "customers" | "suppliers" | "outstanding";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PartySummary = {
  partyId: string;
  name: string;
  type: PartyType;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  partyCategory: string;
  billingAddress?: string;
  billingStateCode?: string;
  balance: number;
  creditLimit: number;
  lastTransactionDate?: string;
  transactionCount: number;
  isActive: boolean;
};

export type PartyListResponse = {
  items: PartySummary[];
  pagination: PaginationMeta;
};

export type PartyDashboardSummary = {
  totalParties: number;
  customers: number;
  suppliers: number;
  both: number;
  toCollect: number;
  toPay: number;
  netOutstanding: number;
  withBalance: number;
};

export type CreatePartyRequest = {
  organisationId: string;
  partyType: PartyType;
  partyCategory: string;
  name: string;
  phone?: string;
  email?: string;
  openingBalance?: number;
  openingBalanceType?: "to_collect" | "to_pay";
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  billingStateCode?: string;
  shippingAddress?: string;
  creditPeriodDays?: number;
  creditLimit?: number;
  contactPersonName?: string;
  contactPersonDob?: string;
  bankAccounts?: Array<{
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    isPrimary?: boolean;
  }>;
  customFields?: Array<{
    fieldType: string;
    fieldLabel?: string;
    customLabel?: string;
    value: string;
  }>;
};

export type PartyBankAccount = {
  bankAccountId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary: boolean;
};

export type UpsertPartyBankAccountRequest = {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  isPrimary?: boolean;
};

export type PartyCustomField = {
  fieldType: string;
  fieldLabel: string;
  value: string;
};

export type PartyLastTransaction = {
  date?: string;
  invoiceNumber?: string;
  type?: string;
  amount?: number;
};

export type PartyDetail = {
  partyId: string;
  organisationId: string;
  partyType: PartyType;
  partyCategory: string;
  name: string;
  phone?: string;
  email?: string;
  openingBalanceAmount: number;
  openingBalanceType: "to_collect" | "to_pay";
  currentBalance: number;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  billingStateCode?: string;
  shippingAddress?: string;
  creditPeriodDays: number;
  creditLimit: number;
  contactPersonName?: string;
  contactPersonDob?: string;
  bankAccounts: PartyBankAccount[];
  customFields: PartyCustomField[];
  status: "ACTIVE" | "INACTIVE";
  transactionCount: number;
  lastTransaction?: PartyLastTransaction;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdatePartyRequest = {
  partyType: PartyType;
  partyCategory: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  billingStateCode?: string;
  shippingAddress?: string;
  creditPeriodDays?: number;
  creditLimit?: number;
  contactPersonName?: string;
  contactPersonDob?: string;
  status?: "ACTIVE" | "INACTIVE";
  bankAccounts?: Array<{
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    isPrimary?: boolean;
  }>;
  customFields?: Array<{
    fieldType: string;
    fieldLabel?: string;
    customLabel?: string;
    value: string;
  }>;
};

export type PartyLedgerEntryType =
  | "opening_balance"
  | "sales_invoice"
  | "invoice_payment"
  | "sales_return"
  | "credit_note"
  | "debit_note"
  | "payment_in"
  | "payment_out"
  | "quotation";

export type PartyLedgerEntry = {
  ledgerEntryId: string;
  entryType: PartyLedgerEntryType;
  entryDate: string;
  referenceId?: string;
  referenceNumber: string;
  description?: string;
  debit: number;
  credit: number;
  amount: number;
  affectsBalance: boolean;
  balance: number;
};

export type PartyLedgerStatement = {
  openingBalance: number;
  closingBalance: number;
  totalSales: number;
  totalReceived: number;
  totalReturns: number;
  entries: PartyLedgerEntry[];
};

export type PartyLedgerParams = {
  from?: string;
  to?: string;
};

export type PartyListParams = {
  view?: "all" | "customers" | "suppliers" | "outstanding";
  partyType?: PartyType | "all";
  status?: "all" | "active" | "inactive";
  balance?: "all" | "receivable" | "payable" | "settled";
  search?: string;
  page?: number;
  limit?: number;
};
