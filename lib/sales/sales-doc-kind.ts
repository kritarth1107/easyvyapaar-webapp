import {
  createQuotation,
  fetchNextQuotationNumber,
  fetchQuotationDetail,
  fetchQuotations,
  updateQuotation,
} from "@/lib/sales/quotations-api-client";
import {
  createProforma,
  fetchNextProformaNumber,
  fetchProformaDetail,
  fetchProformas,
  updateProforma,
} from "@/lib/sales/proformas-api-client";

/** Quotation-shaped sales documents sharing one UI. */
export type QuotationLikeKind = "quotation" | "proforma";

export function quotationLikeApi(kind: QuotationLikeKind) {
  return kind === "proforma"
    ? {
        basePath: "/dashboard/sales/proforma-invoices",
        fetchNext: fetchNextProformaNumber,
        fetchList: fetchProformas,
        fetchDetail: fetchProformaDetail,
        create: createProforma,
        update: updateProforma,
      }
    : {
        basePath: "/dashboard/sales/quotations",
        fetchNext: fetchNextQuotationNumber,
        fetchList: fetchQuotations,
        fetchDetail: fetchQuotationDetail,
        create: createQuotation,
        update: updateQuotation,
      };
}
