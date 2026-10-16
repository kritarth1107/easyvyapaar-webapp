"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/localization";
import type { InvoiceSummaryLabels } from "@/lib/sales/build-live-invoice-preview";

export function useInvoiceSummaryLabels(): InvoiceSummaryLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      taxableAmount: t("dashboard.invoiceSummary.taxableAmount"),
      discountBeforeTax: t("dashboard.invoiceSummary.discountBeforeTax"),
      netTaxable: t("dashboard.invoiceSummary.netTaxable"),
      discountAfterTax: t("dashboard.invoiceSummary.discountAfterTax"),
      roundOff: t("dashboard.invoiceSummary.roundOff"),
      totalAmount: t("dashboard.invoiceSummary.totalAmount"),
      receivedAmount: t("dashboard.invoiceSummary.receivedAmount"),
      balanceAmount: t("dashboard.invoiceSummary.balanceAmount"),
    }),
    [t],
  );
}
