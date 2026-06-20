import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { RadiologistView } from "./components/views/RadiologistView";
import { DepartmentView } from "./components/views/DepartmentView";
import { AlertsView } from "./components/views/AlertsView";
import { OpsView } from "./components/views/OpsView";
import { ToastProvider } from "./components/ui/Toast";
import { LanguageContext, useLanguageState } from "./hooks/useLanguage";
import { usePACS } from "./hooks/usePACS";
import type { UserRole } from "./types";

function AppContent() {
  const [role, setRole] = useState<UserRole>("radiologist");
  const [activeView, setActiveView] = useState<string>("analyze");
  const { unreadCount } = usePACS();

  const renderView = () => {
    if (activeView === "analyze") return <RadiologistView />;
    if (activeView === "search") return <DepartmentView />;
    if (activeView === "archive") return <DepartmentView />;
    if (activeView === "alerts") return <AlertsView />;
    if (activeView === "dashboard") return <OpsView />;
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