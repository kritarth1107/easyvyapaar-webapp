export const AUTH_ERROR_USER_NOT_FOUND = 1001;
export const AUTH_ERROR_MOBILE_ALREADY_REGISTERED = 1014;

export interface ApiErrorPayload {
  description: string;
  errorCode: number;
  details?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: ApiErrorPayload;
}

export interface GetOtpSuccessData {
  userId: string;
  mobile: string;
  name: string;
  verificationToken: string;
  otpSent: boolean;
}

export interface GetOtpSuccessResponse {
  success: true;
  message: string;
  details: string;
  data: GetOtpSuccessData;
}

import type { OrganisationSummary } from "@/lib/types/user-api";

export type { OrganisationSummary } from "@/lib/types/user-api";

export interface VerifyOtpSuccessData {
  userId: string;
  mobile: string;
  name: string;
  isMobileVerified: boolean;
  sessionToken?: string;
  paymentRequired?: boolean;
  paymentToken?: string;
  organisationId?: string;
  organisationName?: string;
  planCode?: string;
  billingCycle?: string;
  amountPaise?: number;
  defaultOrganisationId?: string;
  defaultOrganisation?: OrganisationSummary;
  organisations?: OrganisationSummary[];
}

export interface PaymentCheckoutContext {
  paymentRequired: true;
  paymentToken: string;
  organisationId: string;
  organisationName: string;
  planCode: string;
  billingCycle: string;
  amountPaise: number;
  originalAmountPaise?: number;
  discountPaise?: number;
  taxableAmountPaise?: number;
  gstAmountPaise?: number;
  gstRatePercent?: number;
  couponCode?: string;
  couponTitle?: string;
  paymentMode?: "one_time" | "upi_mandate";
  userId: string;
  mobile: string;
  name: string;
  isMobileVerified: boolean;
}

export type PlanCouponExploreItem = {
  couponCode: string;
  title: string;
  description: string;
  discountLabel: string;
  discountDuration: "first_cycle" | "every_cycle";
  isEligible: boolean;
  reason?: string;
  originalAmountPaise: number;
  discountPaise: number;
  finalAmountPaise: number;
};

export interface PaymentSessionSuccessResponse {
  success: true;
  message: string;
  details?: string;
  data: VerifyOtpSuccessData & {
    sessionToken: string;
    organisations: OrganisationSummary[];
  };
}

export function isPaymentCheckoutContext(data: unknown): data is PaymentCheckoutContext {
  return (
    typeof data === "object" &&
    data !== null &&
    "paymentRequired" in data &&
    (data as PaymentCheckoutContext).paymentRequired === true &&
    typeof (data as PaymentCheckoutContext).paymentToken === "string"
  );
}

export interface VerifyOtpSuccessResponse {
  success: true;
  message: string;
  details: string;
  data: VerifyOtpSuccessData;
}

export interface CheckGstSuccessData {
  gstin: string;
  gstVerified: boolean;
  gstDataMatch?: boolean;
  tradeName?: string;
  legalName?: string;
  billingAddress?: string;
  billingStateCode?: string;
  placeOfSupply?: string;
  mappedOrganisationType?: string;
  constitutionType?: string;
  status?: string;
}

export interface CheckGstSuccessResponse {
  success: true;
  message: string;
  details: string;
  data: CheckGstSuccessData;
}

export interface RegisterSuccessData {
  userId: string;
  organisationId: string;
  userName: string;
  organisationName: string;
  organisationType: string;
  organisationStatus: string;
  currentPlan: string;
  verificationToken: string;
  otpSent: boolean;
  gstVerified: boolean;
  gstDataMatch: boolean;
}

export interface RegisterSuccessResponse {
  success: true;
  message: string;
  details: string;
  data: RegisterSuccessData;
}

export function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    body.success === false &&
    "error" in body
  );
}
