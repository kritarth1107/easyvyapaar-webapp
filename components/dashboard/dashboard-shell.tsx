"use client";

import { useCallback, useEffect, useState } from "react";
import { useScrollbarAutohide } from "@/lib/hooks/use-scrollbar-autohide";
import {
  getSidebarCollapsedPreference,
  setSidebarCollapsedPreference,
} from "@/lib/dashboard/sidebar-preference";
import { UserMeProvider } from "@/components/providers/user-me-provider";
import { BusinessSwitchModal } from "./business-switch";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { ShopSwitchOverlay } from "./shop-switch-overlay";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [businessSwitchOpen, setBusinessSwitchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainScrollRef = useScrollbarAutohide<HTMLElement>();

  useEffect(() => {
    setSidebarCollapsed(getSidebarCollapsedPreference());
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      setSidebarCollapsedPreference(next);
      return next;
    });
  }, []);

  const openBusinessSwitch = () => setBusinessSwitchOpen(true);

  return (
    <UserMeProvider>
      <BusinessSwitchModal
        open={businessSwitchOpen}
        onClose={() => setBusinessSwitchOpen(false)}
      />
      <div className="flex h-screen min-h-screen overflow-hidden bg-brand-surface">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onOpenBusinessSwitch={openBusinessSwitch}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <ShopSwitchOverlay />
          <DashboardTopbar
            onMenuClick={() => setMobileNavOpen(true)}
            onOpenBusinessSwitch={openBusinessSwitch}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebarCollapsed}
          />
          <main ref={mainScrollRef} className="scrollbar-brand flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </UserMeProvider>
  );
}
