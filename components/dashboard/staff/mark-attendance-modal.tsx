"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { CompactDateField } from "@/components/ui/compact-date-field";
import { markAttendance } from "@/lib/staff/staff-api-client";
import {
  ATTENDANCE_STATUS_ORDER,
  getAttendanceStatusUi,
} from "@/lib/staff/attendance-status-ui";
import type { AttendanceStatus } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

type MarkAttendanceModalProps = {
  open: boolean;
  organisationId: string;
  defaultDate: string;
  defaultStaffId?: string;
  staffOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSaved: () => void;
};

function StaffAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/12 to-brand-orange-1/18 text-sm font-bold text-brand-primary"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function MarkAttendanceModal({
  open,
  organisationId,
  defaultDate,
  defaultStaffId,
  staffOptions,
  onClose,
  onSaved,
}: MarkAttendanceModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(defaultDate);
  const [staffId, setStaffId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableStaff = staffOptions.filter((option) => option.value);
  const lockedStaff = Boolean(defaultStaffId?.trim());

  const selectedStaffName = useMemo(() => {
    if (!staffId) return "";
    return selectableStaff.find((option) => option.value === staffId)?.label ?? "";
  }, [staffId, selectableStaff]);

  const statusLabel = (value: AttendanceStatus) => {
    switch (value) {
      case "present":
        return t("dashboard.staff.attendance.present");
      case "absent":
        return t("dashboard.staff.attendance.absent");
      case "half_day":
        return t("dashboard.staff.attendance.halfDay");
      case "leave":
        return t("dashboard.staff.attendance.leave");
      default:
        return value;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setAttendanceDate(defaultDate);
      setStaffId(defaultStaffId ?? "");
      setStatus("present");
      setError(null);
    }
  }, [open, defaultDate, defaultStaffId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, saving, onClose]);

  const handleSubmit = async () => {
    if (!staffId) {
      setError(t("dashboard.staff.attendance.selectStaff"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await markAttendance(organisationId, { staffId, attendanceDate, status });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.saveError"));
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
      aria-labelledby="mark-attendance-modal-title"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="mark-attendance-modal-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.staff.attendance.markModalTitle")}
          </h2>
          <p className="mt-1 text-sm text-brand-primary-muted">
            {t("dashboard.staff.attendance.markModalHint")}
          </p>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.staff.attendance.colDate")}
            </span>
            <CompactDateField
              value={attendanceDate}
              onChange={setAttendanceDate}
              fullWidth
            />
          </label>

          <div className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.staff.colName")}
            </span>
            {lockedStaff && selectedStaffName ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5">
                <StaffAvatar name={selectedStaffName} />
                <span className="text-sm font-semibold text-brand-primary">{selectedStaffName}</span>
              </div>
            ) : (
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
            )}
          </div>

          <fieldset>
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.staff.attendance.colStatus")}
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ATTENDANCE_STATUS_ORDER.map((value) => {
                const ui = getAttendanceStatusUi(value);
                const active = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors ${
                      active ? ui.chipActive : ui.chipIdle
                    }`}
                  >
                    {statusLabel(value)}
                  </button>
                );
              })}
            </div>
          </fieldset>
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
            {saving ? t("dashboard.staff.attendance.saving") : t("dashboard.staff.attendance.mark")}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
