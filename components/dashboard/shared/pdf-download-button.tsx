"use client";

import { useState } from "react";
import { downloadPdf } from "@/lib/print/download-pdf";
import { useTranslation } from "@/lib/localization";

/** Downloads a BFF PDF, keeping the server's Unicode filename (Content-Disposition filename*). */
export function PdfDownloadButton({
  url,
  fallbackFilename,
  className,
  label,
}: {
  url: string | null;
  fallbackFilename: string;
  className?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={!url || busy}
        onClick={() => {
          if (!url) return;
          setBusy(true);
          setError(null);
          void downloadPdf(url, fallbackFilename)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : t("dashboard.pdfDownload.error")))
            .finally(() => setBusy(false));
        }}
        className={
          className ??
          "inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
        }
      >
        {busy ? t("dashboard.pdfDownload.downloading") : (label ?? t("dashboard.pdfDownload.cta"))}
      </button>
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
    </span>
  );
}

/** Shared not-found block for detail pages (backend 404). */
export function NotFoundState({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 rounded-sm border border-slate-200/90 bg-white p-6 text-center">
      <p className="text-base font-semibold text-brand-primary">{title}</p>
      <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.pdfDownload.notFoundHint")}</p>
      <a href={backHref} className="mt-3 inline-block text-sm font-semibold text-brand-primary underline">
        {backLabel}
      </a>
    </div>
  );
}
