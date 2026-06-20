import React from "react";
import {
  Activity,
  Bell,
  BarChart3,
  Users,
  Shield,
} from "lucide-react";
import type { UserRole } from "../../types";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";
import { LanguageToggle } from "../ui/LanguageToggle";

interface SidebarProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeView: string;
  onViewChange: (view: string) => void;
  unreadAlerts: number;
}

const ROLES: { id: UserRole; shortLabel: string }[] = [
  { id: "radiologist", shortLabel: "RAD" },
  { id: "doctor", shortLabel: "DOC" },
  { id: "ops", shortLabel: "OPS" },
];

const NAV_ITEMS: Record<UserRole, { id: string; labelKey: "newAnalysis" | "pacsArchive" | "patientSearch" | "sharedArchive" | "dashboard"; icon: React.ReactNode }[]> = {
  radiologist: [
    { id: "analyze", labelKey: "newAnalysis", icon: <Activity size={16} /> },
    { id: "archive", labelKey: "pacsArchive", icon: <Shield size={16} /> },
  ],
  doctor: [
    { id: "search", labelKey: "patientSearch", icon: <Users size={16} /> },
    { id: "archive", labelKey: "sharedArchive", icon: <Shield size={16} /> },
  ],
  ops: [
    { id: "dashboard", labelKey: "dashboard", icon: <BarChart3 size={16} /> },
  ],
};

const ROLE_LABEL_KEY = {
  radiologist: "roleRadiologist",
  doctor: "roleDoctor",
  ops: "roleOps",
} as const;

const ROLE_INITIALS = {
  radiologist: "EB",
  doctor: "AK",
  ops: "VH",
} as const;

const ROLE_NAME = {
  radiologist: "Dr. Erion Basha",
  doctor: "Dr. Arta Koci",
  ops: "Admin",
} as const;

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  onRoleChange,
  activeView,
  onViewChange,
  unreadAlerts,
}) => {
  const { lang } = useLanguage();
  const navItems = NAV_ITEMS[role];

  return (
    <aside className="w-56 flex-shrink-0 bg-navy-900 border-r border-navy-600 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-navy-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ai-gradient shadow-lg shadow-ai-violet/20">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-wide">{t("appName", lang)}</span>
            <p className="text-xs text-slate-500 leading-none mt-0.5">{t("appTagline", lang)}</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-navy-600">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">
          {lang === "sq" ? "Roli aktiv" : "Active role"}
        </p>
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onRoleChange(r.id);
                onViewChange(NAV_ITEMS[r.id][0].id);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                role === r.id
                  ? "bg-clinical-blue text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-navy-600"
              }`}
            >
              {r.shortLabel}
            </button>
          ))}
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

      <div className="p-3 border-t border-navy-600">
        <LanguageToggle />
      </div>

      <div className="p-4 border-t border-navy-600">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-navy-500 flex items-center justify-center text-xs font-medium text-slate-300">
            {ROLE_INITIALS[role]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{ROLE_NAME[role]}</p>
            <p className="text-xs text-slate-500">{t(ROLE_LABEL_KEY[role], lang)}</p>
          </div>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" title={t("online", lang)} />
        </div>
      </div>
    </aside>
  );
};