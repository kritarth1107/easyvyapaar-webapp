import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard";
import { SITE_NAME } from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `${SITE_NAME} dashboard — billing, inventory, GST reports, and POS for your shop.`,
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
