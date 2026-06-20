import type { PaymentCheckoutContext } from "@/lib/types/auth-api";

export type SignupPlanCode = "STARTER" | "PRO" | "BUSINESS";
export type SignupBillingCycle = "monthly" | "yearly";

export function buildRegisterHref(
  planCode: SignupPlanCode,
  billing: SignupBillingCycle = "yearly"
): string {
  const params = new URLSearchParams({
    plan: planCode,
    billing,
  });
  return `/auth/register?${params.toString()}`;
}

export function normalizeSignupPlanCode(value?: string | null): SignupPlanCode {
  const raw = value?.trim().toUpperCase();
  if (raw === "PRO" || raw === "BUSINESS" || raw === "STARTER") {
    return raw;
  }
  return "STARTER";
}

export function normalizeSignupBillingCycle(value?: string | null): SignupBillingCycle {
  const raw = value?.trim().toLowerCase();
  return raw === "monthly" ? "monthly" : "yearly";
}

export function formatPlanPriceInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export const PAYMENT_TOKEN_STORAGE_KEY = "mahajaan_payment_token";
export const PAYMENT_CONTEXT_STORAGE_KEY = "mahajaan_payment_context";

export function storePaymentCheckout(context: PaymentCheckoutContext): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PAYMENT_TOKEN_STORAGE_KEY, context.paymentToken);
  sessionStorage.setItem(PAYMENT_CONTEXT_STORAGE_KEY, JSON.stringify(context));
}

export function readPaymentCheckout(): PaymentCheckoutContext | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PAYMENT_CONTEXT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PaymentCheckoutContext;
    if (parsed?.paymentRequired && parsed.paymentToken) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function storePaymentToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PAYMENT_TOKEN_STORAGE_KEY, token);
}

export function readPaymentToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PAYMENT_TOKEN_STORAGE_KEY);
}

export function clearPaymentToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PAYMENT_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(PAYMENT_CONTEXT_STORAGE_KEY);
}
