"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { CompactDateField } from "@/components/ui/compact-date-field";
import { createLeaveRequest } from "@/lib/staff/staff-api-client";
import { useTranslation } from "@/lib/localization";

type CreateLeaveRequestModalProps = {
  open: boolean;
  organisationId: string;
  staffOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSaved: () => void;
};

export function CreateLeaveRequestModal({
  open,
  organisationId,
  staffOptions,
  onClose,
  onSaved,
}: CreateLeaveRequestModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [staffId, setStaffId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableStaff = staffOptions.filter((option) => option.value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setStaffId("");
      setFromDate(today);
      setToDate(today);
      setReason("");
      setError(null);
    }
  }, [open, today]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, saving, onClose]);

  const handleFromChange = (value: string) => {
    setFromDate(value);
    if (value > toDate) setToDate(value);
  };

  const handleToChange = (value: string) => {
    setToDate(value);
    if (value < fromDate) setFromDate(value);
  };

  const handleSubmit = async () => {
    if (!staffId) {
      setError(t("dashboard.staff.attendance.selectStaff"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createLeaveRequest(organisationId, {
        staffId,
        fromDate,
        toDate,
        reason: reason.trim() || undefined,
        source: "admin",
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.leaveActionError"));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-primary/40 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-leave-modal-title"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="create-leave-modal-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.staff.attendance.createLeaveRequest")}
          </h2>
          <p className="mt-1 text-sm text-brand-primary-muted">
            {t("dashboard.staff.attendance.createLeaveHint")}
          </p>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.staff.colName")}
            </span>
            <ModernSelect
              value={staffId}
              onChange={setStaffId}
              searchable
              searchPlaceholder={t("dashboard.staff.searchPlaceholder")}
              options={
                selectableStaff.length > 0
                  ? [
                      { value: "", label: t("dashboard.staff.attendance.selectStaff") },
                      ...selectableStaff,
                    ]
                  : [{ value: "", label: t("dashboard.staff.attendance.noStaff") }]
              }
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CompactDateField
              id="leave-from-date"
              label={t("dashboard.staff.attendance.leaveFrom")}
              value={fromDate}
              onChange={handleFromChange}
              fullWidth
            />
            <CompactDateField
              id="leave-to-date"
              label={t("dashboard.staff.attendance.leaveTo")}
              value={toDate}
              onChange={handleToChange}
              fullWidth
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.staff.attendance.leaveReason")}
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("dashboard.staff.attendance.leaveReasonPlaceholder")}
              className="w-full rounded-lg border border-slate-200/90 px-3 py-2 text-sm text-brand-primary shadow-sm outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
            />
          </label>
        </div>

        <footer className="flex gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={saving || selectableStaff.length === 0}
            onClick={() => void handleSubmit()}
            className="h-10 flex-1 rounded-lg bg-brand-primary text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {saving ? t("dashboard.staff.attendance.saving") : t("dashboard.staff.attendance.createLeaveRequest")}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
