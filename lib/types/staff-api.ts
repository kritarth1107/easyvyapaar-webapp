export type StaffStatus = "active" | "inactive";
export type StaffIdType = "aadhaar" | "pan";
export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";
export type PayrollStatus = "draft" | "generated" | "processed" | "paid" | "cancelled";
export type AdjustmentType = "bonus" | "advance" | "reimbursement" | "other";
export type AdjustmentTreatment = "add_extra" | "deduct_next_month";
export type AdjustmentStatus = "pending" | "applied" | "cancelled";

export type StaffBankAccount = {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
};

export type PayrollSalarySegment = {
  fromDate: string;
  toDate: string;
  monthlySalary: number;
  perDaySalary: number;
  calendarDays: number;
  payableDays: number;
  amount: number;
};

export type PayrollProration = {
  payPeriodFrom: string;
  payPeriodTo: string;
  fullMonthlySalary: number;
  monthlyWorkingDays: number;
  paidLeaveAllowed: number;
  paidLeaveAllowedForPeriod: number;
  joiningDate: string;
  daysInPeriod: number;
  eligibleDays: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  absentDays: number;
  holidayDays: number;
  paidLeaveUsed: number;
  unpaidLeaveDays: number;
  assumedPresentDays: number;
  attendanceMarkedDays: number;
  unmarkedDays: number;
  attendanceMismatch: boolean;
  payableDays: number;
  perDaySalary: number;
  proratedSalary: number;
  salarySegments: PayrollSalarySegment[];
};

export type StaffSummary = {
  staffId: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  department?: string;
  monthlySalary: number;
  monthlyWorkingDays?: number;
  paidLeaveAllowed?: number;
  status: StaffStatus;
  joinDate?: string;
};

export type StaffDetail = StaffSummary & {
  organisationId: string;
  address?: string;
  pan?: string;
  idType?: StaffIdType;
  idNumber?: string;
  bankAccount?: StaffBankAccount;
  notes?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRecord = {
  attendanceId: string;
  staffId: string;
  staffName: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
};

export type AttendanceReportEntry = {
  staffId: string;
  staffName: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  totalDays: number;
};

export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type LeaveRequest = {
  leaveRequestId: string;
  staffId: string;
  staffName: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  status: LeaveRequestStatus;
  source?: "admin" | "staff_app";
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

export type LeaveRequestListParams = {
  staffId?: string;
  status?: LeaveRequestStatus | "all";
  page?: number;
  limit?: number;
};

export type CreateLeaveRequestPayload = {
  staffId: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  /** Dashboard creates admin-sourced requests (auto-approved on backend). */
  source?: "admin" | "staff_app";
};

export type ReviewLeaveRequestPayload = {
  reviewNotes?: string;
};

export type PayrollAdjustmentLine = {
  adjustmentId?: string;
  label: string;
  amount: number;
  treatment: string;
};

export type PayrollSummary = {
  payrollId: string;
  staffId: string;
  staffName: string;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  adjustmentBreakdown?: PayrollAdjustmentLine[];
  proration?: PayrollProration;
  notes?: string;
  status: PayrollStatus;
};

export type PayrollMonthSummary = {
  month: string;
  staffCount: number;
  totalNet: number;
  totalBasic: number;
  paidCount: number;
  processedCount: number;
  lastUpdatedAt?: string;
};

export type PayrollMonthDetail = {
  month: string;
  summary: PayrollMonthSummary;
  employees: PayrollSummary[];
};

export type SalaryHistoryEntry = {
  historyId: string;
  staffId: string;
  previousSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason?: string;
  changedByUserId: string;
  createdAt: string;
};

export type StaffAdjustment = {
  adjustmentId: string;
  staffId: string;
  staffName: string;
  type: AdjustmentType;
  amount: number;
  treatment: AdjustmentTreatment;
  sourceMonth: string;
  applyMonth: string;
  paymentDate: string;
  notes?: string;
  status: AdjustmentStatus;
  appliedPayrollId?: string;
  createdAt: string;
};

export type PayrollPreviewEntry = {
  staffId: string;
  staffName: string;
  basicSalary: number;
  autoAllowances: number;
  autoDeductions: number;
  allowances: number;
  deductions: number;
  netPay: number;
  adjustmentBreakdown: PayrollAdjustmentLine[];
  proration?: PayrollProration;
  attendanceMismatch?: boolean;
  existingPayrollId?: string;
  existingStatus?: PayrollStatus;
  editable: boolean;
  notes?: string;
};

export type PayrollPreviewResponse = {
  month: string;
  toDate: string;
  fromDate?: string;
  items: PayrollPreviewEntry[];
};

export type PayrollDetail = PayrollSummary & {
  organisationId: string;
  allowances: number;
  notes?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type StaffListParams = {
  status?: StaffStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
};

export type AttendanceListParams = {
  staffId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type AttendanceReportParams = {
  month: string;
};

export type PayrollListParams = {
  month?: string;
  status?: PayrollStatus | "all";
  staffId?: string;
  page?: number;
  limit?: number;
};

export type PaginatedStaffResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StaffListResponse = PaginatedStaffResponse<StaffSummary>;
export type AttendanceListResponse = PaginatedStaffResponse<AttendanceRecord>;
export type LeaveRequestListResponse = PaginatedStaffResponse<LeaveRequest>;
export type AttendanceReportResponse = {
  month: string;
  items: AttendanceReportEntry[];
};
export type PayrollListResponse = PaginatedStaffResponse<PayrollSummary>;

export type CreateStaffRequest = {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  department?: string;
  monthlySalary: number;
  monthlyWorkingDays?: number;
  paidLeaveAllowed?: number;
  joinDate?: string;
  address?: string;
  pan?: string;
  idType?: StaffIdType;
  idNumber?: string;
  bankAccount?: StaffBankAccount;
  notes?: string;
  status?: StaffStatus;
};

export type UpdateStaffRequest = Partial<CreateStaffRequest>;

export type MarkAttendanceRequest = {
  staffId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
};

export type AttendancePeriodDay = {
  date: string;
  status?: AttendanceStatus;
  attendanceId?: string;
};

export type AttendancePeriodResponse = {
  staffId: string;
  staffName: string;
  fromDate: string;
  toDate: string;
  days: AttendancePeriodDay[];
};

export type BulkMarkAttendanceRequest = {
  staffId: string;
  entries: Array<{
    date: string;
    status: AttendanceStatus;
  }>;
};

export type ChangeSalaryRequest = {
  newSalary: number;
  effectiveDate: string;
  reason?: string;
};

export type CreateStaffAdjustmentRequest = {
  amount: number;
  type?: AdjustmentType;
  treatment: AdjustmentTreatment;
  paymentDate: string;
  notes?: string;
};

export type PayrollGenerateEntry = {
  staffId: string;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  notes?: string;
  attendanceOverride?: boolean;
};

export type GeneratePayrollRequest = {
  toDate: string;
  fromDate?: string;
  month?: string;
  staffIds?: string[];
  staffFromDates?: Record<string, string>;
  entries?: PayrollGenerateEntry[];
};

export type PreviewPayrollRequest = {
  toDate: string;
  fromDate?: string;
  month?: string;
  staffIds?: string[];
  staffFromDates?: Record<string, string>;
};
