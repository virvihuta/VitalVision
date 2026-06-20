import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { RadiologistView } from "./components/views/RadiologistView";
import { DepartmentView } from "./components/views/DepartmentView";
import { AlertsView } from "./components/views/AlertsView";
import { ToastProvider } from "./components/ui/Toast";
import { LanguageContext, useLanguageState } from "./hooks/useLanguage";
import { usePACS } from "./hooks/usePACS";
import type { UserRole } from "./types";
import { useLanguage } from "./hooks/useLanguage";
import { t } from "./i18n";

function Placeholder({ name }: { name: string }) {
  const { lang } = useLanguage();
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-xl font-semibold text-white">{name}</h1>
      <p className="text-sm text-slate-400 mt-1">
        {lang === "sq" ? "Kjo pamje vjen së shpejti" : "This view is coming soon"}
      </p>
      <div className="mt-8 h-96 bg-navy-800/50 border border-navy-700 border-dashed rounded-xl flex items-center justify-center">
        <p className="text-sm text-slate-500">
          {lang === "sq" ? "Në ndërtim" : "Under construction"}
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { lang } = useLanguage();
  const [role, setRole] = useState<UserRole>("radiologist");
  const [activeView, setActiveView] = useState<string>("analyze");
  const { unreadCount } = usePACS();

  const renderView = () => {
    if (activeView === "analyze") return <RadiologistView />;
    if (activeView === "search") return <DepartmentView />;
    if (activeView === "archive") return <DepartmentView />;
    if (activeView === "alerts") return <AlertsView />;
    if (activeView === "dashboard") return <Placeholder name={t("dashboard", lang)} />;
    return <RadiologistView />;
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        role={role}
        onRoleChange={setRole}
        activeView={activeView}
        onViewChange={setActiveView}
        unreadAlerts={unreadCount}
      />
      <main className="flex-1 min-w-0">{renderView()}</main>
    </div>
  );
}

function App() {
  const langState = useLanguageState();

  return (
    <LanguageContext.Provider value={langState}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageContext.Provider>
  );
}

export default App;