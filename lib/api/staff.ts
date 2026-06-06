import { extractBackendError } from "@/lib/api/inventory";
import type {
  AttendanceListResponse,
  AttendanceRecord,
  AttendanceReportResponse,
  PayrollDetail,
  PayrollListResponse,
  PayrollSummary,
  StaffDetail,
  StaffListResponse,
  StaffSummary,
} from "@/lib/types/staff-api";

export { extractBackendError };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function unwrapData(body: unknown): unknown {
  const root = asRecord(body);
  if (root?.success === true && root.data !== undefined) return root.data;
  return body;
}

function normalizePagination(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const page = pickNumber(row.page);
  const limit = pickNumber(row.limit);
  const total = pickNumber(row.total);
  const totalPages = pickNumber(row.totalPages);
  if (page === undefined || limit === undefined || total === undefined || totalPages === undefined) {
    return null;
  }
  return { page, limit, total, totalPages };
}

export function normalizeStaffSummary(raw: unknown): StaffSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const staffId = pickString(row.staffId, row.id);
  const name = pickString(row.name);
  const monthlySalary = pickNumber(row.monthlySalary) ?? pickNumber(row.salary);
  const status = pickString(row.status) as StaffSummary["status"] | undefined;

  if (!staffId || !name || monthlySalary === undefined || !status) return null;

  return {
    staffId,
    name,
    monthlySalary,
    status,
    ...(pickString(row.phone) && { phone: pickString(row.phone) }),
    ...(pickString(row.email) && { email: pickString(row.email) }),
    ...(pickString(row.role) && { role: pickString(row.role) }),
    ...(pickString(row.joinDate) && { joinDate: pickString(row.joinDate) }),
  };
}

export function normalizeStaffDetail(raw: unknown): StaffDetail | null {
  const summary = normalizeStaffSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (!organisationId || !createdByUserId || !createdAt || !updatedAt) return null;

  return {
    ...summary,
    organisationId,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.address) && { address: pickString(row.address) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizeStaffListResponse(body: unknown): StaffListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeStaffSummary(item))
      .filter((item): item is StaffSummary => item !== null),
    pagination,
  };
}

export function normalizeStaffDetailResponse(body: unknown): StaffDetail | null {
  return normalizeStaffDetail(unwrapData(body));
}

export function normalizeAttendanceRecord(raw: unknown): AttendanceRecord | null {
  const row = asRecord(raw);
  if (!row) return null;

  const attendanceId = pickString(row.attendanceId, row.id);
  const staffId = pickString(row.staffId);
  const staffName = pickString(row.staffName);
  const attendanceDate = pickString(row.attendanceDate, row.date);
  const status = pickString(row.status) as AttendanceRecord["status"] | undefined;

  if (!attendanceId || !staffId || !staffName || !attendanceDate || !status) return null;

  return {
    attendanceId,
    staffId,
    staffName,
    attendanceDate,
    status,
    ...(pickString(row.checkIn) && { checkIn: pickString(row.checkIn) }),
    ...(pickString(row.checkOut) && { checkOut: pickString(row.checkOut) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
  };
}

export function normalizeAttendanceListResponse(body: unknown): AttendanceListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeAttendanceRecord(item))
      .filter((item): item is AttendanceRecord => item !== null),
    pagination,
  };
}

export function normalizeAttendanceReportResponse(body: unknown): AttendanceReportResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const month = pickString(row?.month) ?? "";
  const itemsRaw = Array.isArray(row?.items) ? row.items : Array.isArray(data) ? data : [];

  return {
    month,
    items: itemsRaw
      .map((item) => {
        const r = asRecord(item);
        if (!r) return null;
        const staffId = pickString(r.staffId);
        const staffName = pickString(r.staffName);
        const presentDays = pickNumber(r.presentDays);
        const absentDays = pickNumber(r.absentDays);
        const halfDays = pickNumber(r.halfDays);
        const leaveDays = pickNumber(r.leaveDays);
        const totalDays = pickNumber(r.totalDays);
        if (!staffId || !staffName || presentDays === undefined || absentDays === undefined || halfDays === undefined || leaveDays === undefined || totalDays === undefined) {
          return null;
        }
        return { staffId, staffName, presentDays, absentDays, halfDays, leaveDays, totalDays };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

export function normalizePayrollSummary(raw: unknown): PayrollSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const payrollId = pickString(row.payrollId, row.id);
  const staffId = pickString(row.staffId);
  const staffName = pickString(row.staffName);
  const month = pickString(row.month);
  const baseSalary = pickNumber(row.baseSalary);
  const deductions = pickNumber(row.deductions);
  const netPay = pickNumber(row.netPay);
  const status = pickString(row.status) as PayrollSummary["status"] | undefined;

  if (!payrollId || !staffId || !staffName || !month || baseSalary === undefined || deductions === undefined || netPay === undefined || !status) {
    return null;
  }

  return { payrollId, staffId, staffName, month, baseSalary, deductions, netPay, status };
}

export function normalizePayrollDetail(raw: unknown): PayrollDetail | null {
  const summary = normalizePayrollSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const allowances = pickNumber(row.allowances);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (!organisationId || allowances === undefined || !createdAt || !updatedAt) return null;

  return {
    ...summary,
    organisationId,
    allowances,
    createdAt,
    updatedAt,
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.paidDate) && { paidDate: pickString(row.paidDate) }),
  };
}

export function normalizePayrollListResponse(body: unknown): PayrollListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizePayrollSummary(item))
      .filter((item): item is PayrollSummary => item !== null),
    pagination,
  };
}

export function normalizePayrollDetailResponse(body: unknown): PayrollDetail | null {
  return normalizePayrollDetail(unwrapData(body));
}
