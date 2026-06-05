"use client";

import { A4_MIN_HEIGHT, A4_WIDTH } from "@/lib/sales/invoice-preview-data";

type InvoicePreviewPlaceholderProps = {
  themeLabel: string;
};

export function InvoicePreviewPlaceholder({ themeLabel }: InvoicePreviewPlaceholderProps) {
  return (
    <div className="mx-auto w-fit max-w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div
        className="mx-auto flex shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-center"
        style={{ width: A4_WIDTH, minHeight: A4_MIN_HEIGHT, padding: "48px 32px" }}
      >
        <p className="text-sm font-semibold text-brand-primary">{themeLabel}</p>
        <p className="mt-2 max-w-xs text-sm text-brand-primary-muted">
          Invoice preview for this theme is coming soon.
        </p>
      </div>
    </div>
  );
}
