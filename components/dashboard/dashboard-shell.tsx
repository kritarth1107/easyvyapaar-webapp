"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [businessSwitchOpen, setBusinessSwitchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainScrollRef = useScrollbarAutohide<HTMLElement>();

  useEffect(() => {
    setSidebarCollapsed(getSidebarCollapsedPreference());
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F2" || isTypingTarget(event.target)) return;
      event.preventDefault();
      router.push("/dashboard/sales/invoices/new");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

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
          <main ref={mainScrollRef} className="dashboard-content scrollbar-brand flex-1 overflow-y-auto text-brand-primary">
            {children}
          </main>
        </div>
      </div>
    </UserMeProvider>
  );
}
