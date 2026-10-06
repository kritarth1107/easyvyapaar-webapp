"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";

type PurchaseBillPdfPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  filename: string;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PurchaseBillPdfPreviewModal({
  open,
  onClose,
  pdfUrl,
  title,
  filename,
}: PurchaseBillPdfPreviewModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !pdfUrl) return;

    let revoked = false;
    let createdUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);
      try {
        const res = await fetch(pdfUrl);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            (body as { error?: string } | null)?.error ??
              t("dashboard.purchases.view.previewPdfError"),
          );
        }
        const blob = await res.blob();
        createdUrl = URL.createObjectURL(blob);
        if (!revoked) setObjectUrl(createdUrl);
      } catch (err) {
        if (!revoked) {
          setError(
            err instanceof Error ? err.message : t("dashboard.purchases.view.previewPdfError"),
          );
        }
      } finally {
        if (!revoked) setLoading(false);
      }
    };

    void load();

    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, pdfUrl]);

  if (!open || !mounted) return null;

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleOpenTab = () => {
    if (!objectUrl) return;
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(94vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-slate-200/90 bg-brand-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-white px-4 py-3">
          <div className="min-w-0 pr-3">
            <h2 className="text-lg font-bold text-brand-primary">
              {t("dashboard.purchases.view.previewPdf")}
            </h2>
            <p className="mt-0.5 truncate text-sm text-brand-primary-muted">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100 p-3">
          {loading ? (
            <div className="flex h-[min(70vh,720px)] items-center justify-center text-sm text-brand-primary-muted">
              {t("dashboard.purchases.view.loadingPreview")}
            </div>
          ) : error ? (
            <div className="flex h-[min(70vh,720px)] items-center justify-center px-4 text-center text-sm text-red-600">
              {error}
            </div>
          ) : objectUrl ? (
            <iframe
              title={title}
              src={objectUrl}
              className="h-[min(70vh,720px)] w-full rounded-sm border border-slate-200/90 bg-white"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/90 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
          <button
            type="button"
            disabled={!objectUrl}
            onClick={handleOpenTab}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {t("dashboard.purchases.view.openInNewTab")}
          </button>
          <button
            type="button"
            disabled={!objectUrl}
            onClick={handleDownload}
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {t("dashboard.purchases.view.downloadPdf")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
