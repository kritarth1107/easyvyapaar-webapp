export type ProfitLossDelta = {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
};

export type ProfitLossReport = {
  fromDate?: string;
  toDate?: string;
  revenue: {
    grossSales: number;
    salesReturns: number;
    tradeDiscounts: number;
    netRevenue: number;
  };
  cogs: {
    openingStockValue: number;
    totalPurchases: number;
    closingStockValue: number;
    costOfGoodsSold: number;
  };
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    rentUtilities: number;
    staffCosts: number;
    marketing: number;
    logisticsPackaging: number;
    shrinkageWastage: number;
    miscellaneous: number;
    depreciation: number;
    interestExpense: number;
    totalOpEx: number;
    items: { category: string; amount: number; bucket: string }[];
  };
  ebitda: number;
  ebitdaMarginPercent: number;
  belowTheLine: {
    depreciation: number;
    interestExpense: number;
  };
  netProfit: number;
  netMarginPercent: number;
  kpis: {
    grossMarginPercent: number;
    ebitdaMarginPercent: number;
    netMarginPercent: number;
    inventoryTurnover: number;
    salesPerSqFt: number | null;
    returnRatePercent: number;
    staffCostPercentOfRevenue: number;
  };
  paymentModeBreakdown: {
    cash: number;
    upi: number;
    card: number;
    bank: number;
    cheque: number;
    total: number;
  };
  categoryWise: {
    categoryId: string;
    categoryName: string;
    netRevenue: number;
    cogs: number;
    grossProfit: number;
    contributionPercent: number;
  }[];
  statement: { line: string; amount: number; section: string }[];
  comparison?: {
    previousPeriod: {
      fromDate?: string;
      toDate?: string;
      netRevenue: ProfitLossDelta;
      grossProfit: ProfitLossDelta;
      ebitda: ProfitLossDelta;
      netProfit: ProfitLossDelta;
      cogs: ProfitLossDelta;
    };
    sameMonthLastYear: {
      fromDate?: string;
      toDate?: string;
      netRevenue: ProfitLossDelta;
      grossProfit: ProfitLossDelta;
      ebitda: ProfitLossDelta;
      netProfit: ProfitLossDelta;
      cogs: ProfitLossDelta;
    };
  };
};

export function isProfitLossReport(data: unknown): data is ProfitLossReport {
  return typeof data === "object" && data !== null && "revenue" in data && "statement" in data;
}
