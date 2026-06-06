export type DaybookEntryType = "sale" | "purchase" | "payment_in" | "payment_out" | "expense" | "other";

export type DaybookEntry = {
  entryId: string;
  entryDate: string;
  entryType: DaybookEntryType;
  referenceNumber: string;
  partyName?: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
};

export type DaybookListParams = {
  fromDate?: string;
  toDate?: string;
  entryType?: DaybookEntryType | "all";
  search?: string;
  page?: number;
  limit?: number;
};

export type DaybookListResponse = {
  items: DaybookEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  openingBalance?: number;
  closingBalance?: number;
};
