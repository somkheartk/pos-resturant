"use client";

import { useEffect, useState } from "react";
import { HeaderControls } from "@/components/layout/header-controls";
import { Sidebar } from "@/components/layout/sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  initialRole: string;
  initialPermissions: string[];
  userName: string;
  employeeCode: string;
};

export function DashboardShell({
  children,
  initialRole,
  initialPermissions,
  userName,
  employeeCode,
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [badgeByHref, setBadgeByHref] = useState<Record<string, number>>({});

  useEffect(() => {
    const cached = window.localStorage.getItem("pos-sidebar-collapsed");
    if (cached === "1") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("pos-sidebar-collapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  useEffect(() => {
    async function loadCounts() {
      try {
        const response = await fetch("/api/dashboard/counts", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          users: number;
          branches: number;
          products: number;
          category: number;
        };

        setBadgeByHref({
          "/users": payload.users,
          "/branches": payload.branches,
          "/products": payload.products,
          "/categories": payload.category,
        });
      } catch {
        // keep fallback badges when API is unavailable
      }
    }

    void loadCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        badgeByHref={badgeByHref}
        permissions={initialPermissions}
      />

      <div className="flex min-h-screen w-full flex-col">

        <HeaderControls
          initialRole={initialRole}
          userName={userName}
          employeeCode={employeeCode}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onToggleSidebar={() => setIsCollapsed((prev) => !prev)}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
        />

        <div className="animate-[fadeIn_0.4s_ease] px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
