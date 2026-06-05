export type BankAccount = {
  id: string;
  label: string;
  accountNo: string;
  ifsc?: string;
};

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "1",
    label: "7047896266@YBL",
    accountNo: "7047896266@YBL",
  },
  {
    id: "2",
    label: "37544721419",
    accountNo: "37544721419",
    ifsc: "SBIN0015019",
  },
];
