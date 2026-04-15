"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { MoreVertical } from "lucide-react";

type HeaderControlsProps = {
  initialRole: string;
  userName: string;
  employeeCode: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
};

const languages = [
  { code: "th", label: "TH" },
  { code: "en", label: "EN" },
];

export function HeaderControls({
  initialRole,
  userName,
  employeeCode,
  isCollapsed,
  isMobileOpen,
  onToggleSidebar,
  onToggleMobileMenu,
}: HeaderControlsProps) {
  const [language, setLanguage] = useState("th");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lineButtonBase =
    "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md";

  return (
    <header className="sticky top-0 z-20 flex min-h-[104px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className={`${lineButtonBase} lg:hidden`}
          aria-label={isMobileOpen ? "close menu" : "open menu"}
          title={isMobileOpen ? "Close menu" : "Open menu"}
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 h-0.5 w-4 rounded bg-current transition-all duration-300 ${
                isMobileOpen ? "translate-y-[6px] rotate-45" : "translate-y-0"
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-0.5 w-4 rounded bg-current transition-all duration-300 ${
                isMobileOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-3 h-0.5 w-4 rounded bg-current transition-all duration-300 ${
                isMobileOpen ? "-translate-y-[6px] -rotate-45" : "translate-y-0"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className={`${lineButtonBase} hidden lg:inline-flex`}
          aria-label="toggle sidebar"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="flex w-4 flex-col gap-1">
            <span
              className={`h-0.5 rounded bg-current transition-all ${
                isCollapsed ? "w-4" : "w-3"
              }`}
            />
            <span className="h-0.5 w-4 rounded bg-current" />
            <span
              className={`h-0.5 rounded bg-current transition-all ${
                isCollapsed ? "w-4" : "w-2"
              }`}
            />
          </span>
        </button>

        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">POS Admin Panel</p>
        <p className="text-sm font-semibold text-slate-800">สวัสดี, {userName}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{employeeCode}</p>
          <p className="text-sm font-semibold text-slate-800">{userName}</p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="open profile menu"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100/90 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700 ${
              isMenuOpen ? "bg-slate-200 text-slate-700" : ""
            }`}
          >
            <MoreVertical size={18} strokeWidth={2.2} />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.65rem)] z-30 w-72 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-2xl shadow-slate-900/12 backdrop-blur">
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-teal-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">พนักงาน</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{userName}</p>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-3 py-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">รหัสพนักงาน</p>
                    <p className="text-sm font-semibold text-slate-800">{employeeCode}</p>
                  </div>
                  <span className="rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                    {String(initialRole || "-").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((item) => {
                    const isActive = language === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setLanguage(item.code)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "border-teal-300 bg-teal-600 text-white shadow-sm shadow-teal-200"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  void signOut({ callbackUrl: "/login" });
                }}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-900 px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
