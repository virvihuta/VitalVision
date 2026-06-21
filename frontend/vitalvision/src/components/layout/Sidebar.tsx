import React from "react";
import {
  Activity,
  Bell,
  BarChart3,
  Database,
  Users,
} from "lucide-react";
import type { UserRole } from "../../types";
import { useLanguage } from "../../hooks/useLanguage";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { t } from "../../i18n";
import { LanguageToggle } from "../ui/LanguageToggle";
import { SoundToggle } from "../ui/SoundToggle";
import { Logo } from "../ui/Logo";

interface SidebarProps {
  role: UserRole;
  activeView: string;
  onViewChange: (view: string) => void;
  unreadAlerts: number;
}

type NavItem = {
  id: string;
  labelKey: "newAnalysis" | "pacsArchive" | "patientSearch" | "sharedArchive" | "dashboard";
  icon: React.ReactNode;
};

const PACS_NAV: NavItem = { id: "pacs", labelKey: "pacsArchive", icon: <Database size={16} /> };

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  radiologist: [
    { id: "analyze", labelKey: "newAnalysis", icon: <Activity size={16} /> },
    PACS_NAV,
  ],
  department_doctor: [
    { id: "search", labelKey: "patientSearch", icon: <Users size={16} /> },
    PACS_NAV,
  ],
  ops: [
    { id: "dashboard", labelKey: "dashboard", icon: <BarChart3 size={16} /> },
    PACS_NAV,
  ],
};

const ROLE_LABEL_KEY = {
  radiologist: "roleRadiologist",
  department_doctor: "roleDepartmentDoctor",
  ops: "roleOps",
} as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeView,
  onViewChange,
  unreadAlerts,
}) => {
  const { lang } = useLanguage();
  const { user } = useCurrentUser();
  const navItems = NAV_ITEMS[role];

  return (
    <aside className="w-56 flex-shrink-0 bg-navy-900 border-r border-navy-600 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-navy-600">
        <div className="flex items-center gap-2.5">
          <Logo className="text-ai-cyan flex-shrink-0" size={40} />
          <div>
            <span className="text-sm font-semibold text-white tracking-wide">{t("appName", lang)}</span>
            <p className="text-xs text-slate-500 leading-none mt-0.5">{t("appTagline", lang)}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeView === item.id
                ? "bg-clinical-blue/20 text-clinical-blue-light border border-clinical-blue/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-navy-600"
            }`}
          >
            {item.icon}
            {t(item.labelKey, lang)}
          </button>
        ))}

        <button
          onClick={() => onViewChange("alerts")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
            activeView === "alerts"
              ? "bg-clinical-blue/20 text-clinical-blue-light border border-clinical-blue/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-navy-600"
          }`}
        >
          <Bell size={16} />
          {t("alerts", lang)}
          {unreadAlerts > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center leading-none pulse-critical">
              {unreadAlerts}
            </span>
          )}
        </button>
      </nav>

      <div className="p-3 border-t border-navy-600 space-y-2">
        <LanguageToggle />
        <SoundToggle />
      </div>

      <div className="p-4 border-t border-navy-600">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-navy-500 flex items-center justify-center text-xs font-medium text-slate-300">
            {user ? initials(user.name) : "—"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{user?.name ?? ""}</p>
            <p className="text-xs text-slate-500">{t(ROLE_LABEL_KEY[role], lang)}</p>
          </div>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" title={t("online", lang)} />
        </div>
      </div>
    </aside>
  );
};
