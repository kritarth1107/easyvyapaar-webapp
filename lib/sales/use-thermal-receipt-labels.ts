"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/localization";
import type { ThermalReceiptLabels } from "@/lib/sales/print-thermal";

export function useThermalReceiptLabels(): ThermalReceiptLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      taxInvoice: t("dashboard.thermalPrint.taxInvoice"),
      invoiceNo: t("dashboard.thermalPrint.invoiceNo"),
      date: t("dashboard.thermalPrint.date"),
      billTo: t("dashboard.thermalPrint.billTo"),
      item: t("dashboard.thermalPrint.item"),
      qty: t("dashboard.thermalPrint.qty"),
      rate: t("dashboard.thermalPrint.rate"),
      amount: t("dashboard.thermalPrint.amount"),
      gstSummary: t("dashboard.thermalPrint.gstSummary"),
      hsn: t("dashboard.thermalPrint.hsn"),
      taxable: t("dashboard.thermalPrint.taxable"),
      cgst: t("dashboard.thermalPrint.cgst"),
      sgst: t("dashboard.thermalPrint.sgst"),
      totalTax: t("dashboard.thermalPrint.totalTax"),
      total: t("dashboard.thermalPrint.total"),
      received: t("dashboard.thermalPrint.received"),
      balance: t("dashboard.thermalPrint.balance"),
      paymentMode: t("dashboard.thermalPrint.paymentMode"),
      qrPlaceholder: t("dashboard.thermalPrint.qrPlaceholder"),
      thankYou: t("dashboard.thermalPrint.thankYou"),
    }),
    [t],
  );
}
