import {
  extractBackendError,
  normalizeAttendanceListResponse,
  normalizeAttendanceReportResponse,
  normalizePayrollDetailResponse,
  normalizePayrollListResponse,
  normalizeStaffDetailResponse,
  normalizeStaffListResponse,
} from "@/lib/api/staff";
import type {
  AttendanceListParams,
  AttendanceListResponse,
  AttendanceReportParams,
  AttendanceReportResponse,
  CreateStaffRequest,
  GeneratePayrollRequest,
  MarkAttendanceRequest,
  PayrollDetail,
  PayrollListParams,
  PayrollListResponse,
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
      body: JSON.stringify(payload),
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
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to update staff");
  const staff = normalizeStaffDetailResponse(body);
  if (!staff) throw new Error("Failed to update staff");
  return staff;
}

export async function fetchAttendance(
  organisationId: string,
  params: AttendanceListParams = {},
): Promise<AttendanceListResponse> {
  const res = await fetch(
    `/api/staff/attendance?${buildQuery(organisationId, {
      staffId: params.staffId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load attendance");
  return normalizeAttendanceListResponse(body);
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
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to mark attendance");
  return normalizeAttendanceListResponse(body);
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
