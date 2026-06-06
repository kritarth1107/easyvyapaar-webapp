export type SalesTaxMode = "with_tax" | "without_tax";

export type LineTaxInput = {
  qty: number;
  pricePerItem: number;
  discount: number;
  discountType: "percent" | "amount";
  gstPercent: number;
  salesTaxMode: SalesTaxMode;
};

export type LineTaxResult = {
  base: number;
  discountAmt: number;
  taxable: number;
  tax: number;
  amount: number;
};

export type InvoiceLineDisplay = {
  /** Per-unit rate excl. GST (RATE column on invoice). */
  unitRateExcl: number;
  discountAmt: number;
  /** Discount shown on invoice (exclusive base for with_tax lines). */
  discountDisplay: number;
  tax: number;
  amount: number;
  taxable: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeSalesTaxMode(
  mode?: SalesTaxMode | string | null,
): SalesTaxMode {
  return mode === "without_tax" ? "without_tax" : "with_tax";
}

/** Unit price excluding GST — RATE column when price is tax-inclusive. */
export function exclusiveUnitPrice(
  pricePerItem: number,
  gstPercent: number,
  salesTaxMode: SalesTaxMode,
): number {
  if (salesTaxMode !== "with_tax" || gstPercent <= 0) return pricePerItem;
  return roundMoney(pricePerItem / (1 + gstPercent / 100));
}

/** Convert exclusive unit price back to tax-inclusive stored price. */
export function inclusiveUnitPrice(exclusivePrice: number, gstPercent: number): number {
  if (gstPercent <= 0) return exclusivePrice;
  return roundMoney(exclusivePrice * (1 + gstPercent / 100));
}

/** Value shown in the price/item field (always excl. GST for invoice entry). */
export function invoiceLinePriceInputValue(
  pricePerItem: number,
  gstPercent: number,
  salesTaxMode: SalesTaxMode,
): number {
  return exclusiveUnitPrice(pricePerItem, gstPercent, normalizeSalesTaxMode(salesTaxMode));
}

/** Map price/item field input to stored pricePerItem for tax calculation. */
export function invoiceLinePriceFromInput(
  inputValue: number,
  gstPercent: number,
  salesTaxMode: SalesTaxMode,
): number {
  const mode = normalizeSalesTaxMode(salesTaxMode);
  if (mode === "with_tax" && gstPercent > 0) {
    return inclusiveUnitPrice(inputValue, gstPercent);
  }
  return inputValue;
}

/**
 * with_tax: price includes GST → amount = net after discount, tax extracted.
 * without_tax: price excludes GST → tax added on top, amount = taxable + tax.
 */
export function calcLineTaxAmounts(input: LineTaxInput): LineTaxResult {
  const base = roundMoney(input.qty * input.pricePerItem);
  const discountAmt = roundMoney(
    input.discountType === "percent" ? base * (input.discount / 100) : input.discount,
  );
  const net = Math.max(0, roundMoney(base - discountAmt));
  const rate = input.gstPercent / 100;

  if (input.salesTaxMode === "with_tax") {
    const amount = net;
    const taxable = rate > 0 ? roundMoney(amount / (1 + rate)) : amount;
    const tax = roundMoney(amount - taxable);
    return { base, discountAmt, taxable, tax, amount };
  }

  const taxable = net;
  const tax = roundMoney(taxable * rate);
  const amount = roundMoney(taxable + tax);
  return { base, discountAmt, taxable, tax, amount };
}

/** Invoice + form display values derived from one tax calculation. */
export function getInvoiceLineDisplay(input: LineTaxInput): InvoiceLineDisplay {
  const salesTaxMode = normalizeSalesTaxMode(input.salesTaxMode);
  const calc = calcLineTaxAmounts({ ...input, salesTaxMode });
  const rate = input.gstPercent / 100;
  const discountDisplay =
    salesTaxMode === "with_tax" && rate > 0
      ? roundMoney(calc.discountAmt / (1 + rate))
      : calc.discountAmt;

  return {
    unitRateExcl: exclusiveUnitPrice(input.pricePerItem, input.gstPercent, salesTaxMode),
    discountAmt: calc.discountAmt,
    discountDisplay,
    tax: calc.tax,
    amount: calc.amount,
    taxable: calc.taxable,
  };
}

export function inferSalesTaxMode(line: {
  qty: number;
  pricePerItem: number;
  gstPercent: number;
  amount: number;
  salesTaxMode?: SalesTaxMode;
}): SalesTaxMode {
  if (line.salesTaxMode) return normalizeSalesTaxMode(line.salesTaxMode);
  if (line.gstPercent <= 0) return "without_tax";

  const gross = roundMoney(line.qty * line.pricePerItem);
  const withoutTaxTotal = roundMoney(gross * (1 + line.gstPercent / 100));

  if (Math.abs(line.amount - gross) < 0.5) return "with_tax";
  if (Math.abs(line.amount - withoutTaxTotal) < 0.5) return "without_tax";
  return "without_tax";
}
