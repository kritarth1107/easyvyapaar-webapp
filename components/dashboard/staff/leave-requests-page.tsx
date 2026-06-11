"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateLeaveRequestModal } from "@/components/dashboard/staff/create-leave-request-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  formatDate,
  panelClass,
  StatCard,
  tableBodyCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from "@/lib/dashboard/page-utils";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  fetchLeaveRequests,
  fetchStaffList,
  rejectLeaveRequest,
} from "@/lib/staff/staff-api-client";
import type { LeaveRequest, LeaveRequestStatus } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

type LeaveFilter = LeaveRequestStatus | "all";

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

function leaveStatusStyles(status: LeaveRequestStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/15";
    case "approved":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/15";
    case "rejected":
      return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/15";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-400/15";
  }
}

export function LeaveRequestsPage() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";

  const [filter, setFilter] = useState<LeaveFilter>("all");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    if (!orgId) return;
    fetchStaffList(orgId, { status: "active", limit: 100, page: 1 })
      .then((data) =>
        setStaffOptions(data.items.map((s) => ({ value: s.staffId, label: s.name }))),
      )
      .catch(() => setStaffOptions([]));
  }, [orgId]);

  const loadCounts = useCallback(async () => {
    if (!orgId || isWorkspaceLoading) return;
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetchLeaveRequests(orgId, { status: "pending", limit: 1, page: 1 }),
        fetchLeaveRequests(orgId, { status: "approved", limit: 1, page: 1 }),
        fetchLeaveRequests(orgId, { status: "rejected", limit: 1, page: 1 }),
      ]);
      setCounts({
        pending: pending.pagination.total,
        approved: approved.pagination.total,
        rejected: rejected.pagination.total,
      });
    } catch {
      setCounts({ pending: 0, approved: 0, rejected: 0 });
    }
  }, [orgId, isWorkspaceLoading]);

  const load = useCallback(async () => {
    if (!orgId || isWorkspaceLoading) return;
    setLoading(true);
    try {
      const data = await fetchLeaveRequests(orgId, {
        status: filter === "all" ? undefined : filter,
        limit: 100,
        page: 1,
      });
      setRequests(data.items);
      setError(null);
    } catch (err) {
      setRequests([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.leaveActionError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, filter, isWorkspaceLoading, t]);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(), loadCounts()]);
  }, [load, loadCounts]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const statusLabel = useCallback(
    (status: LeaveRequestStatus) => {
      switch (status) {
        case "pending":
          return t("dashboard.staff.attendance.leaveRequestsPending");
        case "approved":
          return t("dashboard.staff.attendance.leaveRequestsApproved");
        case "rejected":
          return t("dashboard.staff.attendance.leaveRequestsRejected");
        case "cancelled":
          return t("dashboard.staff.attendance.cancelLeave");
        default:
          return status;
      }
    },
    [t],
  );

  const filters: { id: LeaveFilter; label: string }[] = useMemo(
    () => [
      { id: "pending", label: t("dashboard.staff.attendance.leaveRequestsPending") },
      { id: "approved", label: t("dashboard.staff.attendance.leaveRequestsApproved") },
      { id: "rejected", label: t("dashboard.staff.attendance.leaveRequestsRejected") },
      { id: "all", label: t("dashboard.staff.attendance.leaveRequestsAll") },
    ],
    [t],
  );

  const runAction = async (
    leaveRequestId: string,
    action: "approve" | "reject" | "cancel",
  ) => {
    setActionId(leaveRequestId);
    setError(null);
    try {
      if (action === "approve") await approveLeaveRequest(orgId, leaveRequestId);
      if (action === "reject") await rejectLeaveRequest(orgId, leaveRequestId);
      if (action === "cancel") await cancelLeaveRequest(orgId, leaveRequestId);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.leaveActionError"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <CreateLeaveRequestModal
        open={createOpen}
        organisationId={orgId}
        staffOptions={staffOptions}
        onClose={() => setCreateOpen(false)}
        onSaved={() => void refreshAll()}
      />

      <Link
        href="/dashboard/staff-payroll/attendance"
        className="text-sm font-semibold text-brand-orange-2 hover:underline"
      >
        ← {t("dashboard.staff.attendance.back")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-brand-primary-muted">
            {t("dashboard.staff.attendance.leavePageSubtitle")}
          </p>
          <h1 className="text-xl font-bold text-brand-primary">
            {t("dashboard.staff.attendance.leaveRequestsTitle")}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!orgId || isWorkspaceLoading}
          className="inline-flex h-9 items-center rounded-lg bg-brand-primary px-3.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
        >
          + {t("dashboard.staff.attendance.createLeaveRequest")}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.staff.attendance.leaveRequestsPending")}
          value={String(counts.pending)}
          accent="amber"
        />
        <StatCard
          label={t("dashboard.staff.attendance.leaveRequestsApproved")}
          value={String(counts.approved)}
          accent="green"
        />
        <StatCard
          label={t("dashboard.staff.attendance.leaveRequestsRejected")}
          value={String(counts.rejected)}
          accent="rose"
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {filters.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-brand-primary text-white"
                  : "bg-white text-brand-primary-muted ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
            <p className="text-xs text-brand-primary-muted">
              {t("dashboard.staff.attendance.leaveRequestsHint")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className={`${tableClass} min-w-[800px]`}>
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colName")}</th>
                  <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.attendance.leaveFrom")}</th>
                  <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.attendance.leaveTo")}</th>
                  <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.attendance.leaveReason")}</th>
                  <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.attendance.leaveStatus")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.attendance.leaveActions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}>
                      {t("common.pleaseWait")}
                    </td>
                  </tr>
                ) : null}
                {!loading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}>
                      {t("dashboard.staff.attendance.leaveRequestsEmpty")}
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  requests.map((row) => {
                    const busy = actionId === row.leaveRequestId;
                    return (
                      <tr key={row.leaveRequestId} className="border-b border-slate-100 last:border-b-0">
                        <td className={tableBodyCellClass}>
                          <div className="flex items-center gap-3 font-medium">
                            <StaffAvatar name={row.staffName} />
                            <span className="truncate">{row.staffName}</span>
                          </div>
                        </td>
                        <td className={`${tableBodyCellClass} text-brand-primary-muted`}>
                          {formatDate(row.fromDate)}
                        </td>
                        <td className={`${tableBodyCellClass} text-brand-primary-muted`}>
                          {formatDate(row.toDate)}
                        </td>
                        <td className={`${tableBodyCellClass} max-w-[200px] truncate text-brand-primary-muted`}>
                          {row.reason?.trim() || "—"}
                        </td>
                        <td className={tableBodyCellClass}>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${leaveStatusStyles(row.status)}`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          {row.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void runAction(row.leaveRequestId, "approve")}
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-60"
                              >
                                {t("dashboard.staff.attendance.approveLeave")}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void runAction(row.leaveRequestId, "reject")}
                                className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                              >
                                {t("dashboard.staff.attendance.rejectLeave")}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void runAction(row.leaveRequestId, "cancel")}
                                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-primary-muted hover:bg-slate-50 disabled:opacity-60"
                              >
                                {t("dashboard.staff.attendance.cancelLeave")}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-brand-primary-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
