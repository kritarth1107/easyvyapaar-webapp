import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_HINT_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth/session";

function sessionCookieOptions() {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function setSessionCookies(sessionToken: string): Promise<void> {
  const cookieStore = await cookies();
  const base = sessionCookieOptions();

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    ...base,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
  });

  cookieStore.set(SESSION_HINT_COOKIE_NAME, "1", {
    ...base,
    httpOnly: false,
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  const base = sessionCookieOptions();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...base,
    httpOnly: true,
    maxAge: 0,
  });

  cookieStore.set(SESSION_HINT_COOKIE_NAME, "", {
    ...base,
    httpOnly: false,
    maxAge: 0,
  });
}
