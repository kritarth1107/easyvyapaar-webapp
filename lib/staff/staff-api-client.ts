import {
  extractBackendError,
  normalizeAttendanceListResponse,
  normalizeAttendancePeriodResponse,
  normalizeAttendanceReportResponse,
  normalizeLeaveRequest,
  normalizeLeaveRequestListResponse,
  normalizePayrollDetailResponse,
  normalizePayrollListResponse,
  normalizePayrollMonthDetailResponse,
  normalizePayrollMonthSummariesResponse,
  normalizePayrollPreviewResponse,
  normalizeSalaryHistoryResponse,
  normalizeStaffAdjustmentsResponse,
  normalizeStaffDetailResponse,
  normalizeStaffListResponse,
  normalizeSalaryHistoryEntry,
  normalizeStaffAdjustment,
  toBackendCreateStaffBody,
  toBackendMarkAttendanceBody,
  toBackendUpdateStaffBody,
} from "@/lib/api/staff";
import type {
  AttendanceListParams,
  AttendanceListResponse,
  AttendancePeriodResponse,
  AttendanceReportParams,
  AttendanceReportResponse,
  CreateLeaveRequestPayload,
  LeaveRequest,
  LeaveRequestListParams,
  LeaveRequestListResponse,
  ReviewLeaveRequestPayload,
  BulkMarkAttendanceRequest,
  ChangeSalaryRequest,
  CreateStaffAdjustmentRequest,
  CreateStaffRequest,
  GeneratePayrollRequest,
  MarkAttendanceRequest,
  PayrollDetail,
  PayrollListParams,
  PayrollListResponse,
  PayrollMonthDetail,
  PayrollMonthSummary,
  PayrollPreviewResponse,
  PreviewPayrollRequest,
  SalaryHistoryEntry,
  StaffAdjustment,
  StaffDetail,
  StaffListParams,
  StaffListResponse,
  UpdateStaffRequest,
} from "@/lib/types/staff-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildQuery(organisationId: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "all" && String(value).trim()) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export async function fetchStaffList(
  organisationId: string,
  params: StaffListParams = {},
): Promise<StaffListResponse> {
  const res = await fetch(
    `/api/staff/staff?${buildQuery(organisationId, {
      status: params.status,
      search: params.search,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load staff");
  return normalizeStaffListResponse(body);
}

export async function fetchStaffDetail(organisationId: string, staffId: string): Promise<StaffDetail> {
  const res = await fetch(
    `/api/staff/staff/${encodeURIComponent(staffId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load staff member");
  const staff = normalizeStaffDetailResponse(body);
  if (!staff) throw new Error("Failed to load staff member");
  return staff;
}

export async function createStaff(organisationId: string, payload: CreateStaffRequest): Promise<StaffDetail> {
  const res = await fetch(
    `/api/staff/staff?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBackendCreateStaffBody(payload)),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create staff");
  const staff = normalizeStaffDetailResponse(body);
  if (!staff) throw new Error("Failed to create staff");
  return staff;
}

export async function updateStaff(
  organisationId: string,
  staffId: string,
  payload: UpdateStaffRequest,
): Promise<StaffDetail> {
  const res = await fetch(
    `/api/staff/staff/${encodeURIComponent(staffId)}?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBackendUpdateStaffBody(payload)),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to update staff");
  const staff = normalizeStaffDetailResponse(body);
  if (!staff) throw new Error("Failed to update staff");
  return staff;
}

const ATTENDANCE_LIST_MAX_LIMIT = 100;

async function fetchAttendancePage(
  organisationId: string,
  params: AttendanceListParams,
): Promise<AttendanceListResponse> {
  const res = await fetch(
    `/api/staff/attendance?${buildQuery(organisationId, {
      staffId: params.staffId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page,
      limit: params.limit ?? ATTENDANCE_LIST_MAX_LIMIT,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load attendance");
  return normalizeAttendanceListResponse(body);
}

export async function fetchAttendance(
  organisationId: string,
  params: AttendanceListParams = {},
): Promise<AttendanceListResponse> {
  const limit = Math.min(params.limit ?? ATTENDANCE_LIST_MAX_LIMIT, ATTENDANCE_LIST_MAX_LIMIT);
  const firstPage = await fetchAttendancePage(organisationId, { ...params, limit, page: 1 });
  const totalPages = firstPage.pagination.totalPages;

  if (totalPages <= 1 || params.page !== undefined) {
    return firstPage;
  }

  const items = [...firstPage.items];
  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await fetchAttendancePage(organisationId, { ...params, limit, page });
    items.push(...nextPage.items);
  }

  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: firstPage.pagination.total,
      totalPages: 1,
    },
  };
}

export async function markAttendance(
  organisationId: string,
  payload: MarkAttendanceRequest,
): Promise<AttendanceListResponse> {
  const res = await fetch(
    `/api/staff/attendance?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBackendMarkAttendanceBody(payload)),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to mark attendance");
  return normalizeAttendanceListResponse(body);
}

export async function fetchAttendancePeriod(
  organisationId: string,
  staffId: string,
  fromDate: string,
  toDate: string,
): Promise<AttendancePeriodResponse> {
  const res = await fetch(
    `/api/staff/attendance/period?${buildQuery(organisationId, {
      staffId,
      fromDate,
      toDate,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load attendance period");
  const period = normalizeAttendancePeriodResponse(body);
  if (!period) throw new Error("Failed to load attendance period");
  return period;
}

export async function bulkMarkAttendance(
  organisationId: string,
  payload: BulkMarkAttendanceRequest,
): Promise<void> {
  const res = await fetch(
    `/api/staff/attendance/bulk?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to save attendance");
}

export async function fetchAttendanceReport(
  organisationId: string,
  params: AttendanceReportParams,
): Promise<AttendanceReportResponse> {
  const res = await fetch(
    `/api/staff/attendance/report?${buildQuery(organisationId, { month: params.month })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load attendance report");
  return normalizeAttendanceReportResponse(body);
}

export async function fetchLeaveRequests(
  organisationId: string,
  params: LeaveRequestListParams = {},
): Promise<LeaveRequestListResponse> {
  const res = await fetch(
    `/api/staff/leave-requests?${buildQuery(organisationId, {
      staffId: params.staffId,
      status: params.status,
      page: params.page,
      limit: params.limit ?? 50,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load leave requests");
  return normalizeLeaveRequestListResponse(body);
}

export async function createLeaveRequest(
  organisationId: string,
  payload: CreateLeaveRequestPayload,
): Promise<LeaveRequest> {
  const res = await fetch(
    `/api/staff/leave-requests?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create leave request");
  const row = normalizeLeaveRequest(
    typeof body === "object" && body !== null && "data" in body
      ? (body as { data: unknown }).data
      : body,
  );
  if (!row) throw new Error("Failed to create leave request");
  return row;
}

export async function approveLeaveRequest(
  organisationId: string,
  leaveRequestId: string,
  payload: ReviewLeaveRequestPayload = {},
): Promise<LeaveRequest> {
  const res = await fetch(
    `/api/staff/leave-requests/${encodeURIComponent(leaveRequestId)}/approve?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to approve leave request");
  const row = normalizeLeaveRequest(
    typeof body === "object" && body !== null && "data" in body
      ? (body as { data: unknown }).data
      : body,
  );
  if (!row) throw new Error("Failed to approve leave request");
  return row;
}

export async function rejectLeaveRequest(
  organisationId: string,
  leaveRequestId: string,
  payload: ReviewLeaveRequestPayload = {},
): Promise<LeaveRequest> {
  const res = await fetch(
    `/api/staff/leave-requests/${encodeURIComponent(leaveRequestId)}/reject?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to reject leave request");
  const row = normalizeLeaveRequest(
    typeof body === "object" && body !== null && "data" in body
      ? (body as { data: unknown }).data
      : body,
  );
  if (!row) throw new Error("Failed to reject leave request");
  return row;
}

export async function cancelLeaveRequest(
  organisationId: string,
  leaveRequestId: string,
): Promise<LeaveRequest> {
  const res = await fetch(
    `/api/staff/leave-requests/${encodeURIComponent(leaveRequestId)}/cancel?organisationId=${encodeURIComponent(organisationId)}`,
    { method: "POST" },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to cancel leave request");
  const row = normalizeLeaveRequest(
    typeof body === "object" && body !== null && "data" in body
      ? (body as { data: unknown }).data
      : body,
  );
  if (!row) throw new Error("Failed to cancel leave request");
  return row;
}

export async function fetchPayrollList(
  organisationId: string,
  params: PayrollListParams = {},
): Promise<PayrollListResponse> {
  const res = await fetch(
    `/api/staff/payroll?${buildQuery(organisationId, {
      month: params.month,
      status: params.status,
      staffId: params.staffId,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load payroll");
  return normalizePayrollListResponse(body);
}

export async function changeStaffSalary(
  organisationId: string,
  staffId: string,
  payload: ChangeSalaryRequest,
): Promise<SalaryHistoryEntry> {
  const res = await fetch(
    `/api/staff/staff/${encodeURIComponent(staffId)}/salary-change?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to change salary");
  const entry = normalizeSalaryHistoryEntry(body);
  if (!entry) throw new Error("Failed to change salary");
  return entry;
}

export async function fetchSalaryHistory(
  organisationId: string,
  staffId: string,
): Promise<SalaryHistoryEntry[]> {
  const res = await fetch(
    `/api/staff/staff/${encodeURIComponent(staffId)}/salary-history?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load salary history");
  const items = normalizeSalaryHistoryResponse(body);
  if (items.length > 0) return items;
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const data = root?.data;
  if (Array.isArray(data)) return data as SalaryHistoryEntry[];
  return items;
}

export async function fetchStaffAdjustments(
  organisationId: string,
  staffId: string,
): Promise<StaffAdjustment[]> {
  const res = await fetch(
    `/api/staff/staff/${encodeURIComponent(staffId)}/adjustments?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load adjustments");
  return normalizeStaffAdjustmentsResponse(body);
}

export async function createStaffAdjustment(
  organisationId: string,
  staffId: string,
  payload: CreateStaffAdjustmentRequest,
): Promise<StaffAdjustment> {
  const res = await fetch(
    `/api/staff/staff/${encodeURIComponent(staffId)}/adjustments?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to record payment");
  const row = normalizeStaffAdjustment(body);
  if (!row) throw new Error("Failed to record payment");
  return row;
}

export async function fetchPayrollMonthSummaries(organisationId: string): Promise<PayrollMonthSummary[]> {
  const res = await fetch(
    `/api/staff/payroll/month-summaries?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load payroll months");
  return normalizePayrollMonthSummariesResponse(body);
}

export async function fetchPayrollMonthDetail(
  organisationId: string,
  month: string,
): Promise<PayrollMonthDetail> {
  const res = await fetch(
    `/api/staff/payroll/month-detail?organisationId=${encodeURIComponent(organisationId)}&month=${encodeURIComponent(month)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load payroll detail");
  const detail = normalizePayrollMonthDetailResponse(body);
  if (!detail) throw new Error("Failed to load payroll detail");
  return detail;
}

export async function previewPayroll(
  organisationId: string,
  payload: PreviewPayrollRequest,
): Promise<PayrollPreviewResponse> {
  const res = await fetch(
    `/api/staff/payroll/preview?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to preview payroll");
  const preview = normalizePayrollPreviewResponse(body);
  if (!preview) throw new Error("Failed to preview payroll");
  return preview;
}

export async function generatePayroll(
  organisationId: string,
  payload: GeneratePayrollRequest,
): Promise<PayrollListResponse> {
  const res = await fetch(
    `/api/staff/payroll?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to generate payroll");
  return normalizePayrollListResponse(body);
}

export async function fetchPayrollDetail(
  organisationId: string,
  payrollId: string,
): Promise<PayrollDetail> {
  const res = await fetch(
    `/api/staff/payroll/${encodeURIComponent(payrollId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load payroll detail");
  const payroll = normalizePayrollDetailResponse(body);
  if (!payroll) throw new Error("Failed to load payroll detail");
  return payroll;
}
