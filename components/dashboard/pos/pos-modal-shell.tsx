"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PosModalShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PosModalShell({
  open,
  title,
  onClose,
  children,
  footer,
  widthClass = "max-w-md",
}: PosModalShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${widthClass} overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-4">
          <h2 id="pos-modal-title" className="text-base font-bold text-brand-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-brand-primary-muted hover:bg-slate-50"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-slate-200/90 px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
