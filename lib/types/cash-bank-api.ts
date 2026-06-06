export type CashBankAccountType = "cash" | "bank";

export type CashBankAccount = {
  accountId: string;
  accountType: CashBankAccountType;
  name: string;
  balance: number;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
};

export type CashBankSummary = {
  totalCash: number;
  totalBank: number;
  totalBalance: number;
  accounts: CashBankAccount[];
};

export type CashBankTransaction = {
  transactionId: string;
  accountId: string;
  accountName: string;
  transactionDate: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

export type CashBankListParams = {
  accountId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type CashBankTransactionsResponse = {
  items: CashBankTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
