"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";
import {
  ATTENDANCE_STATUS_ORDER,
  getAttendanceStatusUi,
} from "@/lib/staff/attendance-status-ui";
import {
  bulkMarkAttendance,
  fetchAttendancePeriod,
} from "@/lib/staff/staff-api-client";
import type { AttendanceStatus } from "@/lib/types/staff-api";

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

function formatShortDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

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
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  const load = useCallback(async () => {
    if (!organisationId || !staffId) return;
    setLoading(true);
    setError(null);
    try {
      const period = await fetchAttendancePeriod(organisationId, staffId, fromDate, toDate);
      setDays(period.days);
      const initial: Record<string, AttendanceStatus | ""> = {};
      for (const day of period.days) {
        initial[day.date] = day.status ?? "";
      }
      setSelection(initial);
      setDirty(false);
      setSelectedDate((current) => {
        if (current && period.days.some((day) => day.date === current)) return current;
        const firstUnmarked = period.days.find((day) => !day.status)?.date;
        return firstUnmarked ?? period.days[0]?.date ?? null;
      });
    } catch (err) {
      setDays([]);
      setSelection({});
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.attendanceLoadError"));
    } finally {
      setLoading(false);
    }
  }, [organisationId, staffId, fromDate, toDate, t]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const incompleteCount = useMemo(
    () => days.filter((day) => !selection[day.date]).length,
    [days, selection],
  );

  const calendarCells = useMemo(() => {
    if (days.length === 0) return [];
    const firstDate = days[0].date;
    const [y, m, d] = firstDate.split("-").map(Number);
    const startOffset = new Date(y, m - 1, d).getDay();
    const blanks = Array.from({ length: startOffset }, (_, index) => ({
      key: `blank-${index}`,
      blank: true as const,
    }));
    const cells = days.map((day) => ({
      key: day.date,
      blank: false as const,
      date: day.date,
    }));
    return [...blanks, ...cells];
  }, [days]);

  const patchStatus = (date: string, status: AttendanceStatus) => {
    setSelection((prev) => ({ ...prev, [date]: status }));
    setDirty(true);
    setSelectedDate(date);
  };

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
      setDirty(false);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const selectedStatus = selectedDate ? selection[selectedDate] : "";

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
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-brand-primary-muted">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  if (cell.blank) {
                    return <div key={cell.key} className="h-11" aria-hidden />;
                  }
                  const status = selection[cell.date];
                  const ui = status ? getAttendanceStatusUi(status) : null;
                  const isSelected = selectedDate === cell.date;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={saving}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`flex h-11 flex-col items-center justify-center rounded-md border text-xs transition-colors ${
                        isSelected
                          ? "border-brand-primary ring-2 ring-brand-primary/20"
                          : "border-slate-200/90"
                      } ${ui ? ui.row : "bg-white"} ${!status ? "bg-white text-brand-primary-muted" : "text-brand-primary"}`}
                      aria-pressed={isSelected}
                      aria-label={formatDayLabel(cell.date)}
                    >
                      <span className="font-semibold tabular-nums">{cell.date.slice(8)}</span>
                      <span className="text-[9px] font-semibold uppercase leading-none">
                        {status ? statusLabel(status).slice(0, 1) : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedDate ? (
                <div className="mt-4 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-3">
                  <p className="text-sm font-semibold text-brand-primary">
                    {formatShortDate(selectedDate)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ATTENDANCE_STATUS_ORDER.map((status) => {
                      const ui = getAttendanceStatusUi(status);
                      const active = selectedStatus === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={saving}
                          onClick={() => patchStatus(selectedDate, status)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            active ? ui.chipActive : ui.chipIdle
                          }`}
                          aria-pressed={active}
                        >
                          {statusLabel(status)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <footer className="shrink-0 flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-brand-primary-muted">
            {incompleteCount > 0
              ? t("dashboard.staff.payroll.attendanceIncompleteCount").replace(
                  "{count}",
                  String(incompleteCount),
                )
              : dirty
                ? t("dashboard.staff.payroll.attendanceDirty")
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
              disabled={saving || loading || days.length === 0 || incompleteCount > 0 || !dirty}
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
