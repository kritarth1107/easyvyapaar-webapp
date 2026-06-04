import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  SESSION_COOKIE_NAME,
  hasSessionCookie,
} from "@/lib/auth/session";

function isAuthenticated(request: NextRequest): boolean {
  return hasSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = isAuthenticated(request);

  if (pathname.startsWith(DASHBOARD_PATH)) {
    if (!loggedIn) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth")) {
    if (loggedIn) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/auth", "/auth/:path*"],
};
