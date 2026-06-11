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

type DayRow = { date: string; status?: AttendanceStatus; attendanceId?: string };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseLocalDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatPeriodLabel(date: string) {
  return parseLocalDate(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatWeekdayLong(date: string) {
  return parseLocalDate(date).toLocaleDateString("en-IN", { weekday: "long" });
}

function formatFullDate(date: string) {
  return parseLocalDate(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildMonthCalendar(monthDays: DayRow[]) {
  const sorted = [...monthDays].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];

  const startOffset = parseLocalDate(sorted[0].date).getDay();
  const blanks = Array.from({ length: startOffset }, (_, index) => ({
    key: `blank-${index}`,
    blank: true as const,
  }));
  const cells = sorted.map((day) => ({
    key: day.date,
    blank: false as const,
    date: day.date,
  }));

  return [...blanks, ...cells];
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
  const [days, setDays] = useState<DayRow[]>([]);
  const [selection, setSelection] = useState<Record<string, AttendanceStatus | "">>({});
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);
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

  const statusShort = useCallback((status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "P";
      case "absent":
        return "A";
      case "half_day":
        return "HD";
      case "leave":
        return "L";
      default:
        return status;
    }
  }, []);

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

  const pickDefaultDate = useCallback(
    (
      periodDays: DayRow[],
      monthKey: string | null,
      currentSelection: Record<string, AttendanceStatus | "">,
    ) => {
      const inMonth = periodDays.filter((day) => day.date.startsWith(monthKey ?? ""));
      const firstUnmarked = inMonth.find((day) => !currentSelection[day.date])?.date;
      return firstUnmarked ?? inMonth[0]?.date ?? periodDays[0]?.date ?? null;
    },
    [],
  );

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

      const firstUnmarked = period.days.find((day) => !day.status)?.date;
      const focusMonth = firstUnmarked?.slice(0, 7) ?? period.days[0]?.date?.slice(0, 7) ?? null;
      setActiveMonthKey(focusMonth);
      setSelectedDate(pickDefaultDate(period.days, focusMonth, initial));
    } catch (err) {
      setDays([]);
      setSelection({});
      setActiveMonthKey(null);
      setSelectedDate(null);
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.attendanceLoadError"));
    } finally {
      setLoading(false);
    }
  }, [organisationId, staffId, fromDate, toDate, t, pickDefaultDate]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const incompleteCount = useMemo(
    () => days.filter((day) => !selection[day.date]).length,
    [days, selection],
  );

  const monthsGrouped = useMemo(() => {
    const map = new Map<string, DayRow[]>();
    for (const day of days) {
      const monthKey = day.date.slice(0, 7);
      const list = map.get(monthKey) ?? [];
      list.push(day);
      map.set(monthKey, list);
    }
    return Array.from(map.entries()).map(([key, monthDays]) => ({
      key,
      label: formatMonthLabel(key),
      days: monthDays,
      incomplete: monthDays.filter((day) => !selection[day.date]).length,
    }));
  }, [days, selection]);

  const activeMonth = useMemo(
    () => monthsGrouped.find((month) => month.key === activeMonthKey) ?? monthsGrouped[0] ?? null,
    [monthsGrouped, activeMonthKey],
  );

  const calendarCells = useMemo(
    () => (activeMonth ? buildMonthCalendar(activeMonth.days) : []),
    [activeMonth],
  );

  const patchStatus = (date: string, status: AttendanceStatus) => {
    setSelection((prev) => ({ ...prev, [date]: status }));
    setDirty(true);
    setSelectedDate(date);
  };

  const markMonthPresent = (monthKey: string) => {
    const monthDays = monthsGrouped.find((month) => month.key === monthKey)?.days ?? [];
    setSelection((prev) => {
      const next = { ...prev };
      for (const day of monthDays) {
        next[day.date] = "present";
      }
      return next;
    });
    setDirty(true);
  };

  const handleMonthChange = (monthKey: string) => {
    setActiveMonthKey(monthKey);
    setSelectedDate(pickDefaultDate(days, monthKey, selection));
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
        className="flex w-full max-w-lg flex-col rounded-t-2xl border border-slate-200/90 bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="payroll-attendance-modal-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.staff.payroll.attendanceModalTitle")}
          </h2>
          <p className="mt-1 text-sm text-brand-primary-muted">
            {staffName} · {formatPeriodLabel(fromDate)} – {formatPeriodLabel(toDate)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-brand-primary-muted">
            {t("dashboard.staff.payroll.attendanceModalHint")}
          </p>
        </header>

        <div className="px-5 py-3 sm:px-6">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="py-6 text-center text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
          ) : monthsGrouped.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                {monthsGrouped.map((month) => {
                  const active = month.key === activeMonth?.key;
                  const shortLabel = formatMonthLabel(month.key).replace(/\s+\d{4}$/, "");
                  return (
                    <button
                      key={month.key}
                      type="button"
                      disabled={saving}
                      onClick={() => handleMonthChange(month.key)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "border-brand-primary bg-brand-primary text-white"
                          : "border-slate-200/90 bg-white text-brand-primary hover:bg-slate-50"
                      }`}
                      aria-pressed={active}
                    >
                      {shortLabel}
                      {month.incomplete > 0 ? (
                        <span
                          className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {month.incomplete}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {activeMonth ? (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-brand-primary-muted">{activeMonth.label}</p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => markMonthPresent(activeMonth.key)}
                    className="text-xs font-semibold text-brand-primary-light hover:text-brand-primary hover:underline"
                  >
                    {t("dashboard.staff.payroll.attendanceMarkMonthPresent")}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {!loading && activeMonth ? (
          <div className="px-5 pb-3 sm:px-6">
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-brand-primary-muted">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                if (cell.blank) {
                  return <div key={cell.key} className="h-10" aria-hidden />;
                }

                const status = selection[cell.date];
                const ui = status ? getAttendanceStatusUi(status) : null;
                const isSelected = selectedDate === cell.date;
                const dayNum = cell.date.slice(8);

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={saving}
                    onClick={() => setSelectedDate(cell.date)}
                    title={`${formatWeekdayLong(cell.date)}, ${formatFullDate(cell.date)}${
                      status ? ` — ${statusLabel(status)}` : ""
                    }`}
                    className={`flex h-10 flex-col items-center justify-center rounded-md border text-brand-primary transition-all ${
                      isSelected
                        ? "border-brand-primary ring-2 ring-brand-primary/25"
                        : "border-slate-200/80"
                    } ${ui ? ui.row : "bg-white"} ${!status ? "text-brand-primary-muted" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`${formatWeekdayLong(cell.date)}, ${formatFullDate(cell.date)}`}
                  >
                    <span className="text-[11px] font-bold leading-none tabular-nums">{dayNum}</span>
                    <span className="mt-0.5 text-[8px] font-bold uppercase leading-none">
                      {status ? statusShort(status) : "·"}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedDate ? (
              <div className="mt-3 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5">
                <p className="text-sm font-semibold text-brand-primary">
                  {formatWeekdayLong(selectedDate)}, {formatFullDate(selectedDate)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ATTENDANCE_STATUS_ORDER.map((statusOption) => {
                    const optionUi = getAttendanceStatusUi(statusOption);
                    const active = selectedStatus === statusOption;
                    return (
                      <button
                        key={statusOption}
                        type="button"
                        disabled={saving}
                        onClick={() => patchStatus(selectedDate, statusOption)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          active ? optionUi.chipActive : optionUi.chipIdle
                        }`}
                        aria-pressed={active}
                      >
                        {statusLabel(statusOption)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

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
