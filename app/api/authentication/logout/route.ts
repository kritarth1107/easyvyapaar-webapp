import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, getApiBaseUrl } from "@/lib/api/backend";
import { clearSessionCookies } from "@/lib/auth/session-cookies";
import { createJsonHeaders } from "@/lib/header-utils";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl && sessionToken) {
    try {
      await fetchBackend(`${apiBaseUrl}auth/logout`, {
        method: "POST",
        headers: createJsonHeaders({ token: sessionToken }),
        timeoutMs: 8_000,
      });
    } catch (error) {
      console.error("Backend logout request failed:", error);
    }
  }

  await clearSessionCookies();

  return NextResponse.json({ success: true });
}
