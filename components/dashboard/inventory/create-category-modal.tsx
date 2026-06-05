"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";

type CreateCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CreateCategoryModal({ open, onClose, onAdd }: CreateCategoryModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    onAdd(trimmed);
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-category-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-md border border-slate-200/90 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
          aria-label={t("common.close")}
        >
          <CloseIcon />
        </button>

        <h3 id="create-category-title" className="pr-8 text-lg font-bold text-brand-primary">
          {t("dashboard.inventory.createItem.createCategoryTitle")}
        </h3>

        <div className="mt-5">
          <label className="block text-sm font-medium text-brand-primary">
            {t("dashboard.inventory.createItem.categoryNameLabel")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
            placeholder={t("dashboard.inventory.createItem.categoryNamePlaceholder")}
            className={`mt-1.5 h-10 w-full rounded-md border px-3 text-sm text-brand-primary outline-none transition-all focus:ring-2 ${
              error
                ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200"
                : "border-slate-200/90 focus:border-brand-orange-1/50 focus:ring-brand-orange-1/15"
            }`}
            autoFocus
          />
          {error && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {t("dashboard.inventory.createItem.categoryNameRequired")}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-200/90 bg-white px-5 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.inventory.createItem.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-10 rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 text-sm font-semibold text-white shadow-[0_2px_8px_-4px_rgba(246,62,22,0.45)] hover:brightness-105"
          >
            {t("dashboard.inventory.createItem.addCategory")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
