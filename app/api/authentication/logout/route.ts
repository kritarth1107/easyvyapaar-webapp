import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/backend";
import { createJsonHeaders } from "@/lib/header-utils";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl && sessionToken) {
    try {
      await fetch(`${apiBaseUrl}auth/logout`, {
        method: "POST",
        headers: createJsonHeaders({ token: sessionToken }),
      });
    } catch (error) {
      console.error("Backend logout request failed:", error);
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
