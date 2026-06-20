import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { clearPaymentToken } from "@/lib/auth/plan-signup";
import { LOGIN_PATH } from "@/lib/auth/session";

export const PAYMENT_LOGIN_QUERY = "payment";
export const PAYMENT_LOGIN_REQUIRED_VALUE = "required";

export function isPaymentSessionExpiredMessage(message: string | null | undefined): boolean {
  if (!message?.trim()) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("sign in again") ||
    lower.includes("payment session expired") ||
    lower.includes("invalid payment token") ||
    lower.includes("payment token")
  );
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isPaymentTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp * 1000 <= Date.now();
}

export function redirectToLoginForPayment(router: AppRouterInstance): void {
  clearPaymentToken();
  router.replace(
    `${LOGIN_PATH}?${PAYMENT_LOGIN_QUERY}=${PAYMENT_LOGIN_REQUIRED_VALUE}`,
  );
}

export function buildLoginForPaymentHref(): string {
  return `${LOGIN_PATH}?${PAYMENT_LOGIN_QUERY}=${PAYMENT_LOGIN_REQUIRED_VALUE}`;
}
