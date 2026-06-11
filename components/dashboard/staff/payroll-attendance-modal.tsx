"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";
import {
  bulkMarkAttendance,
  fetchAttendancePeriod,
} from "@/lib/staff/staff-api-client";
import type { AttendanceStatus } from "@/lib/types/staff-api";

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "half_day", "leave"];

type PayrollAttendanceModalProps = {
  open: boolean;
  organisationId: string;
  staffId: string;
  staffName: string;
  fromDate: string;
  toDate: string;
  onClose: () => void;
  onSaved: () => void;
};

function formatDayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PayrollAttendanceModal({
  open,
  organisationId,
  staffId,
  staffName,
  fromDate,
  toDate,
  onClose,
  onSaved,
}: PayrollAttendanceModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Array<{ date: string; status?: AttendanceStatus; attendanceId?: string }>>([]);
  const [selection, setSelection] = useState<Record<string, AttendanceStatus | "">>({});

  const statusLabel = useCallback(
    (status: AttendanceStatus) => {
      switch (status) {
        case "present":
          return t("dashboard.staff.attendance.present");
        case "absent":
          return t("dashboard.staff.attendance.absent");
        case "half_day":
          return t("dashboard.staff.attendance.halfDay");
        case "leave":
          return t("dashboard.staff.attendance.leave");
        default:
          return status;
      }
    },
    [t],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!open || !organisationId || !staffId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchAttendancePeriod(organisationId, staffId, fromDate, toDate)
      .then((period) => {
        if (cancelled) return;
        setDays(period.days);
        const initial: Record<string, AttendanceStatus | ""> = {};
        for (const day of period.days) {
          initial[day.date] = day.status ?? "";
        }
        setSelection(initial);
      })
      .catch((err) => {
        if (!cancelled) {
          setDays([]);
          setSelection({});
          setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.attendanceLoadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, organisationId, staffId, fromDate, toDate, t]);

  const incompleteCount = useMemo(
    () => days.filter((day) => !selection[day.date]).length,
    [days, selection],
  );

  const handleSave = async () => {
    if (incompleteCount > 0) {
      setError(t("dashboard.staff.payroll.attendanceIncomplete"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await bulkMarkAttendance(organisationId, {
        staffId,
        entries: days.map((day) => ({
          date: day.date,
          status: selection[day.date] as AttendanceStatus,
        })),
      });
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
      className="fixed inset-0 z-[130] flex items-end justify-center bg-brand-primary/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payroll-attendance-modal-title"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="flex h-[min(92dvh,720px)] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-200/90 bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="payroll-attendance-modal-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.staff.payroll.attendanceModalTitle")}
          </h2>
          <p className="mt-1 text-sm text-brand-primary-muted">
            {staffName} · {formatDayLabel(fromDate)} – {formatDayLabel(toDate)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-brand-primary-muted">
            {t("dashboard.staff.payroll.attendanceModalHint")}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-brand sm:px-6">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="py-8 text-center text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
          ) : (
            <div className="space-y-2">
              {days.map((day) => {
                const selected = selection[day.date];
                const wasMarked = Boolean(day.attendanceId || day.status);
                return (
                  <div
                    key={day.date}
                    className={`rounded-lg border px-3 py-2.5 sm:px-4 ${
                      wasMarked ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200/90 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-primary">{formatDayLabel(day.date)}</p>
                        {wasMarked ? (
                          <p className="text-[11px] text-emerald-700">
                            {t("dashboard.staff.payroll.attendanceAlreadyMarked")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_OPTIONS.map((status) => {
                          const active = selected === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                setSelection((prev) => ({ ...prev, [day.date]: status }))
                              }
                              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                active
                                  ? "bg-brand-primary text-white"
                                  : "border border-slate-200 bg-white text-brand-primary hover:bg-slate-50"
                              }`}
                              aria-pressed={active}
                            >
                              {statusLabel(status)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="shrink-0 flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-brand-primary-muted">
            {incompleteCount > 0
              ? t("dashboard.staff.payroll.attendanceIncompleteCount").replace(
                  "{count}",
                  String(incompleteCount),
                )
              : t("dashboard.staff.payroll.attendanceReady")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-10 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-brand-primary sm:flex-none"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={saving || loading || days.length === 0}
              onClick={() => void handleSave()}
              className="h-10 flex-1 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60 sm:flex-none sm:min-w-[140px]"
            >
              {saving ? t("common.pleaseWait") : t("dashboard.staff.payroll.attendanceSave")}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
