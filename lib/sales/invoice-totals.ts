import type { AdditionalCharge, InvoiceLineItem } from "@/lib/sales/create-invoice-form";
import { calcLineTaxAmounts, normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";

function lineTaxCalc(line: InvoiceLineItem) {
  return calcLineTaxAmounts({
    qty: line.qty,
    pricePerItem: line.pricePerItem,
    discount: line.discount,
    discountType: line.discountType,
    gstPercent: line.gstPercent,
    salesTaxMode: normalizeSalesTaxMode(line.salesTaxMode),
  });
}

export type InvoiceDiscountTiming = "after_tax" | "before_tax";

export type GstSplitRow = {
  gstPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  cgst: number;
  sgst: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeDiscountTiming(
  timing?: InvoiceDiscountTiming | string | null,
): InvoiceDiscountTiming {
  return timing === "before_tax" ? "before_tax" : "after_tax";
}

export function calcDiscountAmount(
  base: number,
  discountValue: number,
  discountType: "percent" | "amount",
): number {
  if (discountValue <= 0 || base <= 0) return 0;
  const raw =
    discountType === "percent" ? base * (discountValue / 100) : Math.min(discountValue, base);
  return roundMoney(Math.min(raw, base));
}

export function calcGstSplit(
  lineItems: InvoiceLineItem[],
  additionalCharges: AdditionalCharge[],
  taxRatio: number,
): GstSplitRow[] {
  const taxByRate = new Map<number, number>();

  for (const line of lineItems) {
    const calc = lineTaxCalc(line);
    if (line.gstPercent <= 0 || calc.tax <= 0) continue;
    const scaled = roundMoney(calc.tax * taxRatio);
    taxByRate.set(line.gstPercent, roundMoney((taxByRate.get(line.gstPercent) ?? 0) + scaled));
  }

  for (const charge of additionalCharges) {
    if (charge.taxPercent <= 0 || charge.amount <= 0) continue;
    const tax = roundMoney(charge.amount * (charge.taxPercent / 100) * taxRatio);
    taxByRate.set(
      charge.taxPercent,
      roundMoney((taxByRate.get(charge.taxPercent) ?? 0) + tax),
    );
  }

  return [...taxByRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gstPercent, tax]) => {
      const cgst = roundMoney(tax / 2);
      const sgst = roundMoney(tax - cgst);
      return {
        gstPercent,
        cgstPercent: gstPercent / 2,
        sgstPercent: gstPercent / 2,
        cgst,
        sgst,
      };
    });
}

export type InvoiceLevelTotalsInput = {
  lineItems: InvoiceLineItem[];
  additionalCharges: AdditionalCharge[];
  discountValue: number;
  discountType: "percent" | "amount";
  discountTiming: InvoiceDiscountTiming;
  autoRoundOff: boolean;
  roundOffAmount: number;
  amountReceived: number;
  fullyPaid: boolean;
};

export type InvoiceLevelTotals = {
  subtotal: number;
  lineTax: number;
  additionalChargesTotal: number;
  additionalChargesTax: number;
  taxableAmount: number;
  taxTotal: number;
  discountAmount: number;
  discountTiming: InvoiceDiscountTiming;
  totalBeforeRound: number;
  roundOff: number;
  totalAmount: number;
  balanceAmount: number;
  cgst: number;
  sgst: number;
  gstSplit: GstSplitRow[];
};

export function calcInvoiceLevelTotals(input: InvoiceLevelTotalsInput): InvoiceLevelTotals {
  const lineCalcs = input.lineItems.map(lineTaxCalc);
  const subtotal = lineCalcs.reduce((s, c) => s + c.taxable, 0);
  const grossLineTax = lineCalcs.reduce((s, c) => s + c.tax, 0);

  let additionalChargesTotal = 0;
  let grossAdditionalChargesTax = 0;
  for (const charge of input.additionalCharges) {
    additionalChargesTotal += charge.amount;
    grossAdditionalChargesTax += charge.amount * (charge.taxPercent / 100);
  }

  const grossTaxable = roundMoney(subtotal + additionalChargesTotal);
  const grossTax = roundMoney(grossLineTax + grossAdditionalChargesTax);
  const gross = roundMoney(grossTaxable + grossTax);
  const discountTiming = normalizeDiscountTiming(input.discountTiming);

  let discountAmount: number;
  let taxableAmount: number;
  let lineTax: number;
  let additionalChargesTax: number;
  let taxRatio: number;

  if (discountTiming === "before_tax") {
    discountAmount = calcDiscountAmount(grossTaxable, input.discountValue, input.discountType);
    taxableAmount = roundMoney(Math.max(0, grossTaxable - discountAmount));
    taxRatio = grossTaxable > 0 ? taxableAmount / grossTaxable : 0;
    lineTax = roundMoney(grossLineTax * taxRatio);
    additionalChargesTax = roundMoney(grossAdditionalChargesTax * taxRatio);
  } else {
    discountAmount = calcDiscountAmount(gross, input.discountValue, input.discountType);
    taxableAmount = grossTaxable;
    lineTax = roundMoney(grossLineTax);
    additionalChargesTax = roundMoney(grossAdditionalChargesTax);
    taxRatio = 1;
  }

  const taxTotal = roundMoney(lineTax + additionalChargesTax);
  const totalBeforeDiscount =
    discountTiming === "before_tax" ? roundMoney(taxableAmount + taxTotal) : gross;
  const totalBeforeRound = roundMoney(
    Math.max(0, totalBeforeDiscount - (discountTiming === "after_tax" ? discountAmount : 0)),
  );

  let roundOff = 0;
  let totalAmount = totalBeforeRound;

  if (input.autoRoundOff) {
    const rounded = Math.round(totalBeforeRound);
    roundOff = roundMoney(rounded - totalBeforeRound);
    totalAmount = rounded;
  } else if (input.roundOffAmount !== 0) {
    roundOff = input.roundOffAmount;
    totalAmount = roundMoney(totalBeforeRound + roundOff);
  }

  const received = input.fullyPaid ? totalAmount : input.amountReceived;
  const balanceAmount = Math.max(0, roundMoney(totalAmount - received));
  const gstSplit = calcGstSplit(input.lineItems, input.additionalCharges, taxRatio);
  const cgst = roundMoney(gstSplit.reduce((s, row) => s + row.cgst, 0));
  const sgst = roundMoney(gstSplit.reduce((s, row) => s + row.sgst, 0));

  return {
    subtotal: roundMoney(subtotal),
    lineTax,
    additionalChargesTotal: roundMoney(additionalChargesTotal),
    additionalChargesTax,
    taxableAmount,
    taxTotal,
    discountAmount,
    discountTiming,
    totalBeforeRound,
    roundOff,
    totalAmount,
    balanceAmount,
    cgst,
    sgst,
    gstSplit,
  };
}
