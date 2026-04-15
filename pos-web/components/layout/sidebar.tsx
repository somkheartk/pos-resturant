"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  PackageSearch,
  ShieldCheck,
  TableIcon,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  badgeByHref?: Record<string, number>;
  permissions: string[];
};

type SidebarMenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  requiredPermission: string;
};

type SidebarMenuSection = {
  label: string;
  items: SidebarMenuItem[];
};

const menuSections: SidebarMenuSection[] = [
  {
    label: "Overview",
    items: [
      {
        name: "ภาพรวม",
        href: "/dashboard",
        icon: LayoutDashboard,
        requiredPermission: "dashboard:view",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        name: "Orders",
        href: "/orders",
        icon: ClipboardList,
        badge: 18,
        requiredPermission: "orders:view",
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
        requiredPermission: "orders:view",
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        name: "Food Menu",
        href: "/products",
        icon: Boxes,
        badge: 28,
        requiredPermission: "products:view",
      },
      {
        name: "Categories",
        href: "/categories",
        icon: Grid2X2,
        badge: 6,
        requiredPermission: "categories:view",
      },
      {
        name: "Tables",
        href: "/tables",
        icon: TableIcon,
        badge: 14,
        requiredPermission: "orders:view",
      },
    ],
  },
  {
    label: "Inventory & Purchasing",
    items: [
      {
        name: "Inventory",
        href: "/inventory",
        icon: PackageSearch,
        badge: 41,
        requiredPermission: "inventory:view",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Branches",
        href: "/branches",
        icon: Building2,
        badge: 3,
        requiredPermission: "branches:view",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        name: "Users",
        href: "/users",
        icon: Users,
        badge: 12,
        requiredPermission: "users:view",
      },
      {
        name: "Roles & Permissions",
        href: "/admin/access",
        icon: ShieldCheck,
        requiredPermission: "admin:settings",
      },
    ],
  },
];

const sectionStateStorageKey = "pos-sidebar-expanded-sections";

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  badgeByHref,
  permissions,
}: SidebarProps) {
  const activePath = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(menuSections.map((section) => [section.label, true])),
  );

  const filteredSections = useMemo(
    () =>
      menuSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => permissions.includes(item.requiredPermission)),
        }))
        .filter((section) => section.items.length > 0),
    [permissions],
  );

  useEffect(() => {
    try {
      const rawState = window.localStorage.getItem(sectionStateStorageKey);
      if (!rawState) {
        return;
      }

      const parsedState = JSON.parse(rawState) as Record<string, boolean>;
      setExpandedSections((prev) => ({
        ...prev,
        ...parsedState,
      }));
    } catch {
      // ignore invalid persisted sidebar state
    }
  }, []);

  useEffect(() => {
    setExpandedSections((prev) => {
      const nextState = { ...prev };
      let hasChanged = false;

      for (const section of filteredSections) {
        if (!(section.label in nextState)) {
          nextState[section.label] = true;
          hasChanged = true;
        }

        const hasActiveItem = section.items.some(
          (item) => activePath === item.href || (item.href !== "/dashboard" && activePath.startsWith(item.href)),
        );

        if (hasActiveItem && nextState[section.label] !== true) {
          nextState[section.label] = true;
          hasChanged = true;
        }
      }

      return hasChanged ? nextState : prev;
    });
  }, [activePath, filteredSections]);

  useEffect(() => {
    const visibleSectionState = Object.fromEntries(
      filteredSections.map((section) => [section.label, expandedSections[section.label] ?? true]),
    );

    window.localStorage.setItem(sectionStateStorageKey, JSON.stringify(visibleSectionState));
  }, [expandedSections, filteredSections]);

  function toggleSection(label: string) {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-sm transition lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`gradient-brand fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-white/20 text-white transition-all duration-300 lg:static lg:z-auto ${
          isCollapsed ? "w-[90px]" : "w-72"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`border-b border-white/20 py-6 ${isCollapsed ? "px-3" : "px-6"}`}>
          <p className="text-xs uppercase tracking-[0.28em] text-teal-100">POS</p>
          <h1 className={`mt-2 font-semibold ${isCollapsed ? "text-base" : "text-2xl"}`}>
            {isCollapsed ? "BO" : "Backoffice"}
          </h1>
        </div>

        <nav className={`flex-1 space-y-5 py-6 ${isCollapsed ? "px-2" : "px-4"}`}>
          {filteredSections.map((section) => (
            <div key={section.label}>
              {isCollapsed ? (
                <div className="mx-auto mb-2 h-px w-8 bg-white/25" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[10px] uppercase tracking-[0.22em] text-teal-100/90 transition hover:bg-white/10"
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    size={14}
                    className={`transition ${expandedSections[section.label] ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>
              )}

              <div className={`${isCollapsed || expandedSections[section.label] ? "block" : "hidden"} space-y-2`}>
                {section.items.map((menu) => {
                  const Icon = menu.icon;
                  const dynamicBadge = badgeByHref?.[menu.href];
                  const badge = typeof dynamicBadge === "number" ? dynamicBadge : menu.badge;
                  const isActive =
                    activePath === menu.href ||
                    (menu.href !== "/dashboard" && activePath.startsWith(menu.href));

                  return (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      onClick={onCloseMobile}
                      aria-label={menu.name}
                      className={`group relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                        isActive
                          ? "bg-white text-teal-800 shadow-lg shadow-black/10"
                          : "text-teal-50 hover:bg-white/15"
                      } ${isCollapsed ? "justify-center" : "gap-3"}`}
                      title={menu.name}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 transition ${
                          isActive ? "text-teal-700" : "text-teal-100 group-hover:text-white"
                        }`}
                      />
                      <span className={`${isCollapsed ? "sr-only" : ""}`}>{menu.name}</span>
                      {typeof badge === "number" ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isCollapsed
                              ? "absolute right-2 top-2 min-w-5 border border-white/30 bg-white/20 text-white"
                              : isActive
                                ? "ml-auto border border-teal-300 bg-teal-100 text-teal-800"
                                : "ml-auto border border-white/30 bg-white/20 text-white"
                          }`}
                        >
                          {badge}
                        </span>
                      ) : null}
                      {isCollapsed ? (
                        <span className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-50 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 opacity-0 shadow-xl transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                          {menu.name}
                          {typeof badge === "number" ? ` (${badge})` : ""}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className={`border-t border-white/20 py-4 text-xs text-teal-100 ${
            isCollapsed ? "px-2 text-center" : "px-6"
          }`}
        >
          {isCollapsed ? "Demo" : "Demo: admin@pos.local / 123456"}
        </div>
      </aside>
    </>
  );
}
