export type BalanceSheetLine = {
  id: string;
  side: "assets" | "liabilities_equity";
  group: string;
  label: string;
  amount: number;
  priorAmount?: number;
  change?: number;
  changePercent?: number;
  highlight?: boolean;
};

export type BalanceSheetReport = {
  asOfDate: string;
  month: string;
  generatedAt: string;
  lines: BalanceSheetLine[];
  assets: {
    currentTotal: number;
    nonCurrentTotal: number;
    total: number;
  };
  liabilitiesEquity: {
    currentLiabilitiesTotal: number;
    nonCurrentLiabilitiesTotal: number;
    equityTotal: number;
    total: number;
  };
  balanceCheck: {
    balanced: boolean;
    difference: number;
    totalAssets: number;
    totalLiabilitiesEquity: number;
  };
  kpis: {
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    inventoryToCurrentAssetsPercent: number;
    workingCapital: number;
    returnOnAssetsPercent: number;
    returnOnEquityPercent: number;
  };
  netProfitFromPl: number;
  equityDetail: {
    paidUpCapital: number;
    retainedEarningsOpening: number;
    currentMonthNetProfit: number;
    ownerDrawings: number;
    retainedEarningsClosing: number;
  };
  comparison?: {
    priorAsOfDate: string;
    lines: BalanceSheetLine[];
  };
};

export function isBalanceSheetReport(data: unknown): data is BalanceSheetReport {
  return typeof data === "object" && data !== null && "balanceCheck" in data && "lines" in data;
}
