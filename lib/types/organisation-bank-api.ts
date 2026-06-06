export type OrganisationBankAccount = {
  bankAccountId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary: boolean;
};

export type UpsertOrganisationBankAccountRequest = {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  isPrimary?: boolean;
};

export type OrganisationBankAccountsResponse = {
  bankAccounts: OrganisationBankAccount[];
};
