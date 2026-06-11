"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { CompactDateField } from "@/components/ui/compact-date-field";
import {
  EXPENSE_ATTACHMENT_ACCEPT,
  formatExpenseAttachmentSize,
  getExpenseFileKind,
  isExpenseImageFile,
  MAX_EXPENSE_ATTACHMENTS,
  validateExpenseAttachmentFiles,
  type ExpenseFileKind,
} from "@/lib/finance/expense-attachments";
import {
  createExpense,
  fetchExpenseCategories,
} from "@/lib/finance/expenses-api-client";
import type { ExpenseCategory, ExpensePaymentMode } from "@/lib/types/expenses-api";
import { useTranslation } from "@/lib/localization";

type CreateExpenseModalProps = {
  open: boolean;
  organisationId: string;
  onClose: () => void;
  onSaved: () => void;
};

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl: string | null;
};

const PAYMENT_MODES: ExpensePaymentMode[] = ["cash", "upi", "bank"];

const formGridClass = "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start";
const inputClass =
  "h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium leading-5 text-brand-primary">
      {children}
      {required ? <span className="text-brand-orange-1"> *</span> : null}
    </label>
  );
}

function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FileKindIcon({ kind }: { kind: ExpenseFileKind }) {
  if (kind === "pdf") {
    return (
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-red-50 text-red-600 ring-1 ring-red-100"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path
            d="M8 4h6l4 4v12a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-sky-50 text-sky-700 ring-1 ring-sky-100"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M8 4h6l4 4v12a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 13h5M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function AttachmentPreviewCard({
  entry,
  disabled,
  removeLabel,
  onRemove,
}: {
  entry: PendingAttachment;
  disabled: boolean;
  removeLabel: string;
  onRemove: () => void;
}) {
  const kind = getExpenseFileKind(entry.file);

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80">
      {kind === "image" && entry.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.previewUrl}
          alt={entry.file.name}
          className="h-12 w-12 shrink-0 rounded-sm object-cover ring-1 ring-slate-200/80"
        />
      ) : (
        <FileKindIcon kind={kind} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-primary">{entry.file.name}</p>
        <p className="text-xs text-brand-primary-muted">{formatExpenseAttachmentSize(entry.file.size)}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="shrink-0 text-xs font-semibold text-red-600 transition-colors hover:text-red-700 hover:underline disabled:opacity-60"
      >
        {removeLabel}
      </button>
    </div>
  );
}

export function CreateExpenseModal({
  open,
  organisationId,
  onClose,
  onSaved,
}: CreateExpenseModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>("cash");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokePreviews = useCallback((items: PendingAttachment[]) => {
    for (const item of items) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  const paymentModeLabel = (mode: ExpensePaymentMode) => {
    switch (mode) {
      case "cash":
        return t("dashboard.expenses.create.modeCash");
      case "upi":
        return t("dashboard.expenses.create.modeUpi");
      case "bank":
        return t("dashboard.expenses.create.modeBank");
      default:
        return mode;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !organisationId) return;
    fetchExpenseCategories(organisationId)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [open, organisationId]);

  useEffect(() => {
    if (!open) return;
    setCategoryId("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setPaymentMode("cash");
    setDescription("");
    setAttachments((prev) => {
      revokePreviews(prev);
      return [];
    });
    setDragging(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, revokePreviews]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, saving, onClose]);

  const attachmentValidationMessage = (code: string) => {
    switch (code) {
      case "invalidType":
        return t("dashboard.expenses.create.attachmentsInvalidType");
      case "tooMany":
        return t("dashboard.expenses.create.attachmentsTooMany");
      case "tooLarge":
        return t("dashboard.expenses.create.attachmentsTooLarge");
      default:
        return t("dashboard.expenses.create.saveError");
    }
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const incoming = Array.from(fileList);
    const nextFiles = [...attachments.map((a) => a.file), ...incoming];
    const validationError = validateExpenseAttachmentFiles(nextFiles);
    if (validationError) {
      setError(attachmentValidationMessage(validationError));
      return;
    }

    const newEntries: PendingAttachment[] = incoming.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      previewUrl: isExpenseImageFile(file) ? URL.createObjectURL(file) : null,
    }));

    setError(null);
    setAttachments((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSave = async () => {
    if (!organisationId || !categoryId || !amount) {
      setError(t("dashboard.expenses.create.validation"));
      return;
    }

    const files = attachments.map((item) => item.file);
    const validationError = validateExpenseAttachmentFiles(files);
    if (validationError) {
      setError(attachmentValidationMessage(validationError));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createExpense(
        organisationId,
        {
          categoryId,
          expenseDate,
          amount: Number(amount),
          paymentMode,
          description: description.trim() || undefined,
        },
        files,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.expenses.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  const canAddMore = attachments.length < MAX_EXPENSE_ATTACHMENTS;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/45 p-3 backdrop-blur-[3px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-expense-modal-title"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="flex h-[min(720px,92vh)] w-[min(680px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_24px_60px_-16px_rgba(3,31,73,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <h2 id="create-expense-modal-title" className="text-lg font-bold text-brand-primary">
              {t("dashboard.expenses.createTitle")}
            </h2>
            <p className="text-xs text-brand-primary-muted">{t("dashboard.expenses.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary disabled:opacity-60"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="scrollbar-brand min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {error ? (
            <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="space-y-6">
            <FormField label={t("dashboard.expenses.colCategory")} required>
              <ModernSelect
                value={categoryId}
                onChange={setCategoryId}
                options={[
                  { value: "", label: t("dashboard.expenses.create.selectCategory") },
                  ...categories.map((c) => ({ value: c.categoryId, label: c.name })),
                ]}
              />
            </FormField>

            <div className={formGridClass}>
              <FormField label={t("dashboard.expenses.colDate")} required>
                <CompactDateField
                  id="expense-date"
                  value={expenseDate}
                  onChange={setExpenseDate}
                  fullWidth
                />
              </FormField>
              <FormField label={t("dashboard.expenses.colAmount")} required>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("dashboard.expenses.create.amount")}
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label={t("dashboard.financePayments.colMode")}>
              <div className="flex flex-wrap gap-5 sm:gap-6">
                {PAYMENT_MODES.map((mode) => (
                  <label key={mode} className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="expense-payment-mode"
                      checked={paymentMode === mode}
                      onChange={() => setPaymentMode(mode)}
                      className="h-4 w-4 border-slate-300 text-brand-orange-1 focus:ring-brand-orange-1/30"
                    />
                    <span className="text-sm font-medium text-brand-primary">
                      {paymentModeLabel(mode)}
                    </span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label={t("dashboard.expenses.colDescription")}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t("dashboard.expenses.create.description")}
                className={`${inputClass} min-h-[88px] resize-y py-2.5`}
              />
            </FormField>

            <div>
              <FieldLabel>{t("dashboard.expenses.create.attachments")}</FieldLabel>
              <p className="mt-1 text-xs text-brand-primary-muted">
                {t("dashboard.expenses.create.attachmentsHint")}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={EXPENSE_ATTACHMENT_ACCEPT}
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />

              <div
                className={`mt-3 rounded-md border border-dashed p-5 transition-colors ${
                  dragging
                    ? "border-brand-orange-1 bg-brand-surface-warm/80"
                    : "border-slate-200 bg-slate-50/80"
                } ${!canAddMore ? "opacity-60" : ""}`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (canAddMore) setDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (canAddMore) setDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (e.currentTarget === e.target) setDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (!canAddMore || saving) return;
                  addFiles(e.dataTransfer.files);
                }}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-primary-muted ring-1 ring-slate-200/90">
                    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                      <path
                        d="M12 16V8m0 0l-3 3m3-3l3 3M5 20h14a1 1 0 001-1V6l-5-4H5a1 1 0 00-1 1v17z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="text-sm text-brand-primary-muted">
                    {t("dashboard.expenses.create.dropFiles")}{" "}
                    <button
                      type="button"
                      disabled={saving || !canAddMore}
                      onClick={() => fileInputRef.current?.click()}
                      className="font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline disabled:opacity-60"
                    >
                      {t("dashboard.expenses.create.browseFiles")}
                    </button>
                  </p>
                </div>
              </div>

              {attachments.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {attachments.map((entry) => (
                    <AttachmentPreviewCard
                      key={entry.id}
                      entry={entry}
                      disabled={saving}
                      removeLabel={t("dashboard.expenses.create.removeFile")}
                      onRemove={() => removeAttachment(entry.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-7">
          <div className="flex min-h-10 items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-10 rounded-sm border border-slate-200/90 bg-white px-5 text-sm font-semibold text-brand-primary transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-10 rounded-sm bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(246,62,22,0.4)] transition-all hover:brightness-105 disabled:opacity-60"
            >
              {saving ? t("dashboard.expenses.create.saving") : t("dashboard.expenses.create.save")}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
