import { SESSION_HINT_COOKIE_NAME } from "@/lib/auth/session";

export function hasClientSessionHint(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${SESSION_HINT_COOKIE_NAME}=1`);
}
