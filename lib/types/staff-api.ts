export type StaffStatus = "active" | "inactive";
export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";
export type PayrollStatus = "draft" | "generated" | "paid";

export type StaffSummary = {
  staffId: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  monthlySalary: number;
  status: StaffStatus;
  joinDate?: string;
};

export type StaffDetail = StaffSummary & {
  organisationId: string;
  address?: string;
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

export type PayrollSummary = {
  payrollId: string;
  staffId: string;
  staffName: string;
  month: string;
  baseSalary: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
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
  monthlySalary: number;
  joinDate?: string;
  address?: string;
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

export type GeneratePayrollRequest = {
  month: string;
  staffIds?: string[];
};
