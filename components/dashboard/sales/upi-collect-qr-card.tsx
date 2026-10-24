"use client";

import Link from "next/link";
import { SignedQrImage } from "@/components/dashboard/sales/signed-qr-image";
import { formatInr } from "@/lib/sales/create-invoice-form";
import {
  buildUpiCollectUri,
  shopVpaFromPaymentQr,
  showUpiCollectQr,
} from "@/lib/sales/upi-collect";
import { useTranslation } from "@/lib/localization";

const SETTINGS_HREF = "/dashboard/sales/invoices/settings";

export function UpiCollectQrCard({
  status,
  balanceAmount,
  displayNumber,
  paymentQr,
}: {
  status: string;
  balanceAmount: number;
  displayNumber: string;
  paymentQr?: string | null;
}) {
  const { t } = useTranslation();

  if (!showUpiCollectQr({ status, balanceAmount })) return null;

  const vpa = shopVpaFromPaymentQr(paymentQr);
  const uri = vpa
    ? buildUpiCollectUri({ vpa, amount: balanceAmount, note: displayNumber })
    : null;

  return (
    <div className="rounded-sm border border-slate-200/90 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-brand-primary">
        {t("dashboard.salesInvoices.view.collectUpi")}
      </h2>
      {vpa && uri ? (
        <div className="mt-3 flex flex-col items-center text-center">
          <p className="w-full text-left text-xs text-brand-primary-muted">
            {t("dashboard.salesInvoices.view.collectUpiScan").replace(
              "{amount}",
              formatInr(balanceAmount),
            )}
          </p>
          <div className="mt-3 rounded-sm border border-slate-100 bg-white p-2">
            <SignedQrImage value={uri} size={200} alt={t("dashboard.salesInvoices.view.collectUpi")} />
          </div>
          <p className="mt-2 text-sm font-semibold text-brand-primary">{vpa}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-brand-primary-muted">
            {t("dashboard.salesInvoices.view.collectUpiRecordHint")}
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-brand-primary">
            {t("dashboard.salesInvoices.view.collectUpiEmpty")}
          </p>
          <Link
            href={SETTINGS_HREF}
            className="mt-2 inline-flex h-9 items-center text-sm font-semibold text-brand-orange-2 hover:underline"
          >
            {t("dashboard.salesInvoices.view.collectUpiAdd")}
          </Link>
        </div>
      )}
    </div>
  );
}
