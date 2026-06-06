import banksData from "@/lib/json/banks.json";

export type BankCatalogEntry = {
  bankName: string;
  mainBranchIFSC: string;
  BankWebsite: string;
  BankType: string;
};

const BANKS = banksData as BankCatalogEntry[];

const BANK_BY_NAME = new Map(BANKS.map((bank) => [bank.bankName, bank]));

export function getBankCatalog(): BankCatalogEntry[] {
  return BANKS;
}

export function getBankSelectOptions(): { value: string; label: string }[] {
  return BANKS.map((bank) => ({
    value: bank.bankName,
    label: bank.bankName,
  }));
}

export function getBankByName(bankName: string): BankCatalogEntry | undefined {
  return BANK_BY_NAME.get(bankName.trim());
}

export function getMainBranchIfsc(bankName: string): string | null {
  const bank = getBankByName(bankName);
  return bank?.mainBranchIFSC ?? null;
}
