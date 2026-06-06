export type ExpenseStatus = "completed" | "cancelled";
export type ExpensePaymentMode = "cash" | "upi" | "card" | "bank" | "cheque";

export type ExpenseCategory = {
  categoryId: string;
  name: string;
  description?: string;
};

export type ExpenseSummary = {
  expenseId: string;
  displayNumber: string;
  categoryId: string;
  categoryName: string;
  expenseDate: string;
  amount: number;
  paymentMode: ExpensePaymentMode;
  status: ExpenseStatus;
  description?: string;
};

export type ExpenseDetail = ExpenseSummary & {
  organisationId: string;
  expensePrefix: string;
  expenseNumber: string;
  referenceNumber?: string;
  notes?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextExpenseNumber = {
  expensePrefix: string;
  expenseNumber: string;
  suggestedDisplay: string;
};

export type ExpenseListParams = {
  categoryId?: string;
  status?: ExpenseStatus | "all";
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type ExpenseListResponse = {
  items: ExpenseSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateExpenseRequest = {
  categoryId: string;
  expensePrefix?: string;
  expenseNumber?: string;
  expenseDate: string;
  amount: number;
  paymentMode?: ExpensePaymentMode;
  description?: string;
  referenceNumber?: string;
  notes?: string;
};
