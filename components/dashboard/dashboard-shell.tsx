"use client";

import { useState } from "react";
import { useScrollbarAutohide } from "@/lib/hooks/use-scrollbar-autohide";
import { UserMeProvider } from "@/components/providers/user-me-provider";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { ShopSwitchOverlay } from "./shop-switch-overlay";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainScrollRef = useScrollbarAutohide<HTMLElement>();

  return (
    <UserMeProvider>
      <div className="flex h-screen min-h-screen overflow-hidden bg-brand-surface">
        <DashboardSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <ShopSwitchOverlay />
          <DashboardTopbar onMenuClick={() => setMobileNavOpen(true)} />
          <main ref={mainScrollRef} className="scrollbar-brand flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </UserMeProvider>
  );
}
