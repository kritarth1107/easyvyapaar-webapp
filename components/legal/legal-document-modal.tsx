"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LEGAL_ENTITY } from "@/legal/company";
import type { LegalDocument } from "@/legal/types";
import { LegalDocumentContent } from "./legal-document-content";

type LegalDocumentModalProps = {
  open: boolean;
  onClose: () => void;
  legalDocument: LegalDocument;
  closeLabel: string;
  viewFullLabel: string;
};

export function LegalDocumentModal({
  open,
  onClose,
  legalDocument,
  closeLabel,
  viewFullLabel,
}: LegalDocumentModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const fullPageHref = `/legal/${legalDocument.slug}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-primary/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`legal-modal-${legalDocument.slug}`}
      onClick={onClose}
    >
      <div
        className="flex h-[min(92dvh,720px)] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-200/90 bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-slate-200/90 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange-2">
            {LEGAL_ENTITY.productName} Legal
          </p>
          <h2
            id={`legal-modal-${legalDocument.slug}`}
            className="mt-1 text-lg font-bold text-brand-primary sm:text-xl"
          >
            {legalDocument.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-primary-muted">{legalDocument.description}</p>
          <dl className="mt-3 grid gap-1 text-xs text-brand-primary-muted sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-brand-primary">Effective date</dt>
              <dd>{legalDocument.effectiveDate}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-primary">Last updated</dt>
              <dd>{legalDocument.lastUpdated}</dd>
            </div>
          </dl>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 scrollbar-brand sm:px-6">
          <LegalDocumentContent document={legalDocument} />
        </div>

        <footer className="shrink-0 flex flex-col gap-3 border-t border-slate-200/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href={fullPageHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand-orange-2 hover:underline"
          >
            {viewFullLabel}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="login-btn-primary w-full rounded-xs px-4 py-3 text-sm font-semibold sm:w-auto sm:min-w-[120px]"
          >
            {closeLabel}
          </button>
        </footer>
      </div>
    </div>,
    globalThis.document.body,
  );
}
