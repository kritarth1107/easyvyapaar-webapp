import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard";
import { hasSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { SITE_NAME } from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `${SITE_NAME} dashboard — billing, inventory, GST reports, and POS for your shop.`,
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession = hasSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return <DashboardShell hasSession={hasSession}>{children}</DashboardShell>;
}
