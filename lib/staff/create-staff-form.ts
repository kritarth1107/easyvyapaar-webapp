export type StaffIdType = "aadhaar" | "pan" | "";

export type StaffBankAccountForm = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
};

import {
  getOptionalIndianMobileError,
  normalizeOptionalIndianMobileForSave,
} from "@/lib/validators/indian-mobile";

export type CreateStaffFormState = {
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  monthlySalary: string;
  monthlyWorkingDays: string;
  paidLeaveAllowed: string;
  joinDate: string;
  address: string;
  idType: StaffIdType;
  idNumber: string;
  pan: string;
  bankAccount: StaffBankAccountForm;
  notes: string;
};

export function createInitialStaffForm(): CreateStaffFormState {
  return {
    name: "",
    phone: "",
    email: "",
    role: "",
    department: "",
    monthlySalary: "",
    monthlyWorkingDays: "30",
    paidLeaveAllowed: "3",
    joinDate: new Date().toISOString().slice(0, 10),
    address: "",
    idType: "",
    idNumber: "",
    pan: "",
    bankAccount: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
    },
    notes: "",
  };
}

export function hasBankAccountDetails(bank: StaffBankAccountForm): boolean {
  return Boolean(
    bank.accountHolderName.trim() ||
      bank.bankName.trim() ||
      bank.accountNumber.trim() ||
      bank.ifscCode.trim(),
  );
}

export function mapCreateStaffFormToRequest(form: CreateStaffFormState) {
  const bank = hasBankAccountDetails(form.bankAccount)
    ? {
        ...(form.bankAccount.accountHolderName.trim()
          ? { accountHolderName: form.bankAccount.accountHolderName.trim() }
          : {}),
        ...(form.bankAccount.bankName.trim() ? { bankName: form.bankAccount.bankName.trim() } : {}),
        ...(form.bankAccount.accountNumber.trim()
          ? { accountNumber: form.bankAccount.accountNumber.trim() }
          : {}),
        ...(form.bankAccount.ifscCode.trim()
          ? { ifscCode: form.bankAccount.ifscCode.trim().toUpperCase() }
          : {}),
      }
    : undefined;

  return {
    name: form.name.trim(),
    phone: normalizeOptionalIndianMobileForSave(form.phone),
    email: form.email.trim() || undefined,
    role: form.role.trim() || undefined,
    department: form.department.trim() || undefined,
    monthlySalary: Number(form.monthlySalary),
    monthlyWorkingDays: Number(form.monthlyWorkingDays) || 30,
    paidLeaveAllowed: Number(form.paidLeaveAllowed) || 3,
    joinDate: form.joinDate,
    address: form.address.trim() || undefined,
    pan: form.pan.trim().toUpperCase() || undefined,
    idType: form.idType || undefined,
    idNumber: form.idNumber.trim() || undefined,
    bankAccount: bank,
    notes: form.notes.trim() || undefined,
  };
}

export function validateCreateStaffForm(
  form: CreateStaffFormState,
  messages: {
    required: string;
    phoneInvalid: string;
    idTypeRequired: string;
    idNumberRequired: string;
  },
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = messages.required;
  if (!form.monthlySalary || Number(form.monthlySalary) < 0) errors.monthlySalary = messages.required;
  const phoneError = getOptionalIndianMobileError(form.phone);
  if (phoneError) errors.phone = messages.phoneInvalid;
  if (form.idNumber.trim() && !form.idType) errors.idType = messages.idTypeRequired;
  if (form.idType && !form.idNumber.trim()) errors.idNumber = messages.idNumberRequired;
  return errors;
}
