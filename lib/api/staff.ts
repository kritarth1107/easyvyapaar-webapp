import { extractBackendError } from "@/lib/api/inventory";
import type {
  AttendanceListResponse,
  AttendanceRecord,
  AttendanceReportResponse,
  CreateStaffRequest,
  MarkAttendanceRequest,
  PayrollDetail,
  PayrollListResponse,
  PayrollMonthDetail,
  PayrollPreviewResponse,
  PayrollSummary,
  SalaryHistoryEntry,
  StaffAdjustment,
  StaffDetail,
  StaffListResponse,
  StaffSummary,
  UpdateStaffRequest,
} from "@/lib/types/staff-api";

export { extractBackendError };

/** Map frontend staff fields to backend API body. */
export function toBackendCreateStaffBody(payload: CreateStaffRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: payload.name,
    monthlySalary: payload.monthlySalary,
    monthlyWorkingDays: payload.monthlyWorkingDays ?? 30,
    paidLeaveAllowed: payload.paidLeaveAllowed ?? 3,
    joiningDate: payload.joinDate ?? new Date().toISOString().slice(0, 10),
  };
  if (payload.phone?.trim()) body.phone = payload.phone.trim();
  if (payload.email?.trim()) body.email = payload.email.trim();
  if (payload.role?.trim()) body.designation = payload.role.trim();
  if (payload.department?.trim()) body.department = payload.department.trim();
  if (payload.address?.trim()) body.address = payload.address.trim();
  if (payload.pan?.trim()) body.pan = payload.pan.trim().toUpperCase();
  if (payload.idType) body.idType = payload.idType;
  if (payload.idNumber?.trim()) body.idNumber = payload.idNumber.trim();
  if (payload.notes?.trim()) body.notes = payload.notes.trim();
  if (payload.bankAccount) {
    const bank: Record<string, string> = {};
    if (payload.bankAccount.accountHolderName?.trim()) bank.accountHolderName = payload.bankAccount.accountHolderName.trim();
    if (payload.bankAccount.bankName?.trim()) bank.bankName = payload.bankAccount.bankName.trim();
    if (payload.bankAccount.accountNumber?.trim()) bank.accountNumber = payload.bankAccount.accountNumber.trim();
    if (payload.bankAccount.ifscCode?.trim()) bank.ifscCode = payload.bankAccount.ifscCode.trim().toUpperCase();
    if (Object.keys(bank).length > 0) body.bankAccount = bank;
  }
  if (payload.status) body.status = payload.status;
  return body;
}

export function toBackendUpdateStaffBody(payload: UpdateStaffRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.role !== undefined) body.designation = payload.role;
  if (payload.department !== undefined) body.department = payload.department;
  if (payload.monthlySalary !== undefined) body.monthlySalary = payload.monthlySalary;
  if (payload.monthlyWorkingDays !== undefined) body.monthlyWorkingDays = payload.monthlyWorkingDays;
  if (payload.paidLeaveAllowed !== undefined) body.paidLeaveAllowed = payload.paidLeaveAllowed;
  if (payload.joinDate !== undefined) body.joiningDate = payload.joinDate;
  if (payload.address !== undefined) body.address = payload.address;
  if (payload.pan !== undefined) body.pan = payload.pan;
  if (payload.idType !== undefined) body.idType = payload.idType;
  if (payload.idNumber !== undefined) body.idNumber = payload.idNumber;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.bankAccount !== undefined) body.bankAccount = payload.bankAccount;
  if (payload.status !== undefined) body.status = payload.status;
  return body;
}

export function toBackendMarkAttendanceBody(payload: MarkAttendanceRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    staffId: payload.staffId,
    date: payload.attendanceDate,
    status: payload.status,
  };
  if (payload.checkIn?.trim()) body.checkIn = payload.checkIn.trim();
  if (payload.checkOut?.trim()) body.checkOut = payload.checkOut.trim();
  if (payload.notes?.trim()) body.notes = payload.notes.trim();
  return body;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
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
    ...(pickString(row.role, row.designation) && { role: pickString(row.role, row.designation) }),
    ...(pickString(row.department) && { department: pickString(row.department) }),
    ...(pickString(row.joinDate, row.joiningDate) && {
      joinDate: pickString(row.joinDate, row.joiningDate),
    }),
    monthlyWorkingDays: pickNumber(row.monthlyWorkingDays) ?? 30,
    paidLeaveAllowed: pickNumber(row.paidLeaveAllowed) ?? 3,
  };
}

function normalizePayrollSalarySegment(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const fromDate = pickString(row.fromDate);
  const toDate = pickString(row.toDate);
  const monthlySalary = pickNumber(row.monthlySalary);
  const perDaySalary = pickNumber(row.perDaySalary);
  const calendarDays = pickNumber(row.calendarDays);
  const payableDays = pickNumber(row.payableDays);
  const amount = pickNumber(row.amount);
  if (
    !fromDate ||
    !toDate ||
    monthlySalary === undefined ||
    perDaySalary === undefined ||
    calendarDays === undefined ||
    payableDays === undefined ||
    amount === undefined
  ) {
    return null;
  }
  return { fromDate, toDate, monthlySalary, perDaySalary, calendarDays, payableDays, amount };
}

function normalizePayrollProration(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return undefined;
  const payPeriodFrom = pickString(row.payPeriodFrom);
  const payPeriodTo = pickString(row.payPeriodTo);
  const joiningDate = pickString(row.joiningDate);
  const fullMonthlySalary = pickNumber(row.fullMonthlySalary);
  const monthlyWorkingDays = pickNumber(row.monthlyWorkingDays);
  const paidLeaveAllowed = pickNumber(row.paidLeaveAllowed);
  const eligibleDays = pickNumber(row.eligibleDays);
  const payableDays = pickNumber(row.payableDays);
  const perDaySalary = pickNumber(row.perDaySalary);
  const proratedSalary = pickNumber(row.proratedSalary);
  if (
    fullMonthlySalary === undefined ||
    monthlyWorkingDays === undefined ||
    paidLeaveAllowed === undefined ||
    !joiningDate ||
    eligibleDays === undefined ||
    payableDays === undefined ||
    perDaySalary === undefined ||
    proratedSalary === undefined
  ) {
    return undefined;
  }
  const resolvedPayPeriodFrom = payPeriodFrom ?? joiningDate;
  const resolvedPayPeriodTo = payPeriodTo ?? joiningDate;
  const segmentsRaw = Array.isArray(row.salarySegments) ? row.salarySegments : [];
  const salarySegments = segmentsRaw
    .map((item) => normalizePayrollSalarySegment(item))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return {
    payPeriodFrom: resolvedPayPeriodFrom,
    payPeriodTo: resolvedPayPeriodTo,
    fullMonthlySalary,
    monthlyWorkingDays,
    paidLeaveAllowed,
    paidLeaveAllowedForPeriod: pickNumber(row.paidLeaveAllowedForPeriod) ?? 0,
    joiningDate,
    daysInPeriod: pickNumber(row.daysInPeriod) ?? 0,
    eligibleDays,
    presentDays: pickNumber(row.presentDays) ?? 0,
    halfDays: pickNumber(row.halfDays) ?? 0,
    leaveDays: pickNumber(row.leaveDays) ?? 0,
    absentDays: pickNumber(row.absentDays) ?? 0,
    holidayDays: pickNumber(row.holidayDays) ?? 0,
    paidLeaveUsed: pickNumber(row.paidLeaveUsed) ?? 0,
    unpaidLeaveDays: pickNumber(row.unpaidLeaveDays) ?? 0,
    assumedPresentDays: pickNumber(row.assumedPresentDays) ?? 0,
    attendanceMarkedDays: pickNumber(row.attendanceMarkedDays) ?? 0,
    unmarkedDays: pickNumber(row.unmarkedDays) ?? 0,
    attendanceMismatch: row.attendanceMismatch === true,
    payableDays,
    perDaySalary,
    proratedSalary,
    salarySegments,
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

  const bankRaw = asRecord(row.bankAccount);
  const bankAccount =
    bankRaw &&
    (pickString(bankRaw.accountHolderName) ||
      pickString(bankRaw.bankName) ||
      pickString(bankRaw.accountNumber) ||
      pickString(bankRaw.ifscCode))
      ? {
          ...(pickString(bankRaw.accountHolderName) && { accountHolderName: pickString(bankRaw.accountHolderName) }),
          ...(pickString(bankRaw.bankName) && { bankName: pickString(bankRaw.bankName) }),
          ...(pickString(bankRaw.accountNumber) && { accountNumber: pickString(bankRaw.accountNumber) }),
          ...(pickString(bankRaw.ifscCode) && { ifscCode: pickString(bankRaw.ifscCode) }),
        }
      : undefined;

  return {
    ...summary,
    organisationId,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.address) && { address: pickString(row.address) }),
    ...(pickString(row.pan) && { pan: pickString(row.pan) }),
    ...(pickString(row.idType) && { idType: pickString(row.idType) as StaffDetail["idType"] }),
    ...(pickString(row.idNumber) && { idNumber: pickString(row.idNumber) }),
    ...(bankAccount ? { bankAccount } : {}),
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
  const itemsRaw = Array.isArray(row?.staffSummaries)
    ? row.staffSummaries
    : Array.isArray(row?.items)
      ? row.items
      : Array.isArray(data)
        ? data
        : [];

  return {
    month,
    items: itemsRaw
      .map((item) => {
        const r = asRecord(item);
        if (!r) return null;
        const staffId = pickString(r.staffId);
        const staffName = pickString(r.staffName);
        const presentDays = pickNumber(r.presentDays, r.present);
        const absentDays = pickNumber(r.absentDays, r.absent);
        const halfDays = pickNumber(r.halfDays, r.halfDay);
        const leaveDays = pickNumber(r.leaveDays, r.leave);
        const totalDays = pickNumber(r.totalDays);
        if (!staffId || !staffName || presentDays === undefined || absentDays === undefined || halfDays === undefined || leaveDays === undefined || totalDays === undefined) {
          return null;
        }
        return { staffId, staffName, presentDays, absentDays, halfDays, leaveDays, totalDays };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

function mapPayrollStatus(raw: string | undefined): PayrollSummary["status"] | undefined {
  if (!raw) return undefined;
  if (raw === "processed") return "generated";
  return raw as PayrollSummary["status"];
}

function normalizeAdjustmentBreakdown(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const label = pickString(row.label);
      const amount = pickNumber(row.amount);
      const treatment = pickString(row.treatment);
      if (!label || amount === undefined || !treatment) return null;
      return {
        label,
        amount,
        treatment,
        ...(pickString(row.adjustmentId) && { adjustmentId: pickString(row.adjustmentId) }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return items.length > 0 ? items : undefined;
}

export function normalizePayrollSummary(raw: unknown): PayrollSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const payrollId = pickString(row.payrollId, row.id);
  const staffId = pickString(row.staffId);
  const staffName = pickString(row.staffName);
  const month = pickString(row.month);
  const baseSalary = pickNumber(row.baseSalary, row.basicSalary);
  const allowances = pickNumber(row.allowances) ?? 0;
  const deductions = pickNumber(row.deductions);
  const netPay = pickNumber(row.netPay);
  const status = mapPayrollStatus(pickString(row.status));

  if (!payrollId || !staffId || !staffName || !month || baseSalary === undefined || deductions === undefined || netPay === undefined || !status) {
    return null;
  }

  return {
    payrollId,
    staffId,
    staffName,
    month,
    baseSalary,
    allowances,
    deductions,
    netPay,
    status,
    ...normalizeAdjustmentBreakdown(row.adjustmentBreakdown)
      ? { adjustmentBreakdown: normalizeAdjustmentBreakdown(row.adjustmentBreakdown) }
      : {},
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(normalizePayrollProration(row.proration) ? { proration: normalizePayrollProration(row.proration) } : {}),
  };
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

export function normalizeSalaryHistoryEntry(raw: unknown): SalaryHistoryEntry | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const historyId = pickString(row.historyId);
  const staffId = pickString(row.staffId);
  const previousSalary = pickNumber(row.previousSalary);
  const newSalary = pickNumber(row.newSalary);
  const effectiveDate = pickString(row.effectiveDate);
  const changedByUserId = pickString(row.changedByUserId);
  const createdAt = pickString(row.createdAt);
  if (!historyId || !staffId || previousSalary === undefined || newSalary === undefined || !effectiveDate || !changedByUserId || !createdAt) {
    return null;
  }
  return {
    historyId,
    staffId,
    previousSalary,
    newSalary,
    effectiveDate,
    changedByUserId,
    createdAt,
    ...(pickString(row.reason) && { reason: pickString(row.reason) }),
  };
}

export function normalizeSalaryHistoryResponse(body: unknown): SalaryHistoryEntry[] {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(row?.items)
    ? row.items
    : Array.isArray(data)
      ? data
      : Array.isArray(body)
        ? body
        : [];
  return itemsRaw
    .map((item) => {
      const normalized = normalizeSalaryHistoryEntry(item);
      if (normalized) return normalized;
      const existing = asRecord(item);
      if (
        existing &&
        pickString(existing.historyId) &&
        pickNumber(existing.previousSalary) !== undefined &&
        pickNumber(existing.newSalary) !== undefined
      ) {
        return item as SalaryHistoryEntry;
      }
      return null;
    })
    .filter((item): item is SalaryHistoryEntry => item !== null);
}

export function normalizeStaffAdjustment(raw: unknown): StaffAdjustment | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const adjustmentId = pickString(row.adjustmentId);
  const staffId = pickString(row.staffId);
  const staffName = pickString(row.staffName);
  const type = pickString(row.type) as StaffAdjustment["type"] | undefined;
  const amount = pickNumber(row.amount);
  const treatment = pickString(row.treatment) as StaffAdjustment["treatment"] | undefined;
  const sourceMonth = pickString(row.sourceMonth);
  const applyMonth = pickString(row.applyMonth);
  const paymentDate = pickString(row.paymentDate);
  const status = pickString(row.status) as StaffAdjustment["status"] | undefined;
  const createdAt = pickString(row.createdAt);
  if (
    !adjustmentId ||
    !staffId ||
    !staffName ||
    !type ||
    amount === undefined ||
    !treatment ||
    !sourceMonth ||
    !applyMonth ||
    !paymentDate ||
    !status ||
    !createdAt
  ) {
    return null;
  }
  return {
    adjustmentId,
    staffId,
    staffName,
    type,
    amount,
    treatment,
    sourceMonth,
    applyMonth,
    paymentDate,
    status,
    createdAt,
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.appliedPayrollId) && { appliedPayrollId: pickString(row.appliedPayrollId) }),
  };
}

export function normalizeStaffAdjustmentsResponse(body: unknown): StaffAdjustment[] {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(row?.items) ? row.items : Array.isArray(data) ? data : [];
  return itemsRaw
    .map((item) => normalizeStaffAdjustment(item))
    .filter((item): item is StaffAdjustment => item !== null);
}

export function normalizePayrollPreviewResponse(body: unknown): PayrollPreviewResponse | null {
  const data = unwrapData(body);
  const row = asRecord(data);
  if (!row) return null;
  const month = pickString(row.month);
  const toDate = pickString(row.toDate);
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  if (!month || !toDate) return null;

  const items = itemsRaw
    .map((item) => {
      const r = asRecord(item);
      if (!r) return null;
      const staffId = pickString(r.staffId);
      const staffName = pickString(r.staffName);
      const basicSalary = pickNumber(r.basicSalary);
      const autoAllowances = pickNumber(r.autoAllowances);
      const autoDeductions = pickNumber(r.autoDeductions);
      const allowances = pickNumber(r.allowances);
      const deductions = pickNumber(r.deductions);
      const netPay = pickNumber(r.netPay);
      const editable = r.editable === true;
      if (
        !staffId ||
        !staffName ||
        basicSalary === undefined ||
        autoAllowances === undefined ||
        autoDeductions === undefined ||
        allowances === undefined ||
        deductions === undefined ||
        netPay === undefined
      ) {
        return null;
      }
      return {
        staffId,
        staffName,
        basicSalary,
        autoAllowances,
        autoDeductions,
        allowances,
        deductions,
        netPay,
        editable,
        adjustmentBreakdown: normalizeAdjustmentBreakdown(r.adjustmentBreakdown) ?? [],
        ...(pickString(r.existingPayrollId) && { existingPayrollId: pickString(r.existingPayrollId) }),
        ...(pickString(r.existingStatus) && {
          existingStatus: mapPayrollStatus(pickString(r.existingStatus)),
        }),
        ...(pickString(r.notes) && { notes: pickString(r.notes) }),
        ...(normalizePayrollProration(r.proration) ? { proration: normalizePayrollProration(r.proration) } : {}),
        ...(r.attendanceMismatch === true ? { attendanceMismatch: true } : {}),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    month,
    toDate,
    ...(pickString(row.fromDate) ? { fromDate: pickString(row.fromDate) } : {}),
    items,
  };
}

export function normalizePayrollMonthSummary(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const month = pickString(row.month);
  const staffCount = pickNumber(row.staffCount);
  const totalNet = pickNumber(row.totalNet);
  const totalBasic = pickNumber(row.totalBasic);
  const paidCount = pickNumber(row.paidCount);
  const processedCount = pickNumber(row.processedCount);
  if (!month || staffCount === undefined || totalNet === undefined || totalBasic === undefined || paidCount === undefined || processedCount === undefined) {
    return null;
  }
  return {
    month,
    staffCount,
    totalNet,
    totalBasic,
    paidCount,
    processedCount,
    ...(pickString(row.lastUpdatedAt) && { lastUpdatedAt: pickString(row.lastUpdatedAt) }),
  };
}

export function normalizePayrollMonthSummariesResponse(body: unknown) {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(row?.items) ? row.items : [];
  return itemsRaw
    .map((item) => normalizePayrollMonthSummary(item))
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function normalizePayrollMonthDetailResponse(body: unknown) {
  const data = unwrapData(body);
  const row = asRecord(data);
  if (!row) return null;
  const month = pickString(row.month);
  const summary = normalizePayrollMonthSummary(row.summary);
  const employeesRaw = Array.isArray(row.employees) ? row.employees : [];
  if (!month || !summary) return null;
  return {
    month,
    summary,
    employees: employeesRaw
      .map((item) => normalizePayrollSummary(item))
      .filter((item): item is PayrollSummary => item !== null),
  };
}
