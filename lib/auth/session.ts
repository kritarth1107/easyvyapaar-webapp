/** HttpOnly session cookie set after login or registration OTP verification. */
export const SESSION_COOKIE_NAME = "zktech_erp_token";

/** Client-readable hint that a session may exist (avoids blocking marketing header on /api/user/me). */
export const SESSION_HINT_COOKIE_NAME = "mahajaan_session_hint";

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const DASHBOARD_PATH = "/dashboard";
export const LOGIN_PATH = "/auth/login";

export function hasSessionCookie(token: string | undefined): boolean {
  return typeof token === "string" && token.trim().length > 0;
}
